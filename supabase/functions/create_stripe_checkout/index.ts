import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const successUrlPath = '/payment-success?session_id={CHECKOUT_SESSION_ID}';
const cancelUrlPath = '/payment-cancel';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    metadata?: Record<string, string>;
}

interface CheckoutRequest {
    items: OrderItem[];
    currency?: string;
    metadata?: Record<string, any>;
}

function ok(data: any): Response {
    return new Response(
        JSON.stringify({ code: "SUCCESS", message: "ok", data }),
        {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        }
    );
}

function fail(msg: string, code = 400): Response {
    return new Response(
        JSON.stringify({ code: "FAIL", message: msg }),
        {
            status: code,
            headers: { "Content-Type": "application/json", ...corsHeaders }
        }
    );
}

Deno.serve(async (req) => {
    try {
        if (req.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }
        if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

        const request = await req.json() as CheckoutRequest;
        
        if (!request.items?.length) throw new Error("Items cannot be empty");
        
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "");
        const { data: { user } } = token
            ? await supabase.auth.getUser(token)
            : { data: { user: null } };

        if (!user) throw new Error("Authentication required");

        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "sk_test_mock";
        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
        });

        const formattedItems = request.items.map(item => ({
            name: item.name.trim(),
            price: Math.round(item.price * 100),
            quantity: item.quantity,
            image_url: item.image_url?.trim() || "",
            metadata: item.metadata
        }));

        const totalAmount = formattedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const currency = request.currency || "usd";

        const { data: order, error } = await supabase
            .from("orders")
            .insert({
                user_id: user.id,
                items: formattedItems,
                total_amount: totalAmount,
                currency: currency.toLowerCase(),
                status: "pending",
                metadata: request.metadata || {}
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to create order: ${error.message}`);

        const origin = req.headers.get("origin") || "http://localhost:5173";

        const session = await stripe.checkout.sessions.create({
            line_items: formattedItems.map(item => ({
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                        name: item.name,
                        images: item.image_url ? [item.image_url] : [],
                    },
                    unit_amount: item.price,
                },
                quantity: item.quantity,
            })),
            mode: "payment",
            success_url: `${origin}${successUrlPath}`,
            cancel_url: `${origin}${cancelUrlPath}`,
            payment_method_types: ['link', 'card'], // Integrate Link
            metadata: {
                order_id: order.id,
                user_id: user.id,
                order_metadata: JSON.stringify(request.metadata || {})
            },
        });

        await supabase
            .from("orders")
            .update({
                stripe_session_id: session.id,
            })
            .eq("id", order.id);

        return ok({
            url: session.url,
            sessionId: session.id,
            orderId: order.id,
        });
    } catch (error) {
        return fail(error instanceof Error ? error.message : "Payment processing failed", 500);
    }
});
