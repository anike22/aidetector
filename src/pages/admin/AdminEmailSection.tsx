import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Settings, Send, LayoutTemplate, Clock, Bell, Users, BarChart3, List, Search } from 'lucide-react';
import { EmailSettingsTab } from '@/components/admin/email/EmailSettingsTab';
import { EmailOverviewTab } from '@/components/admin/email/EmailOverviewTab';
import { EmailLogsTab } from '@/components/admin/email/EmailLogsTab';
import { EmailComposeTab } from '@/components/admin/email/EmailComposeTab';
import { EmailTemplatesTab } from '@/components/admin/email/EmailTemplatesTab';
import { EmailAutomationsTab } from '@/components/admin/email/EmailAutomationsTab';
import { EmailSubscribersTab } from '@/components/admin/email/EmailSubscribersTab';
import { EmailCampaignsTab } from '@/components/admin/email/EmailCampaignsTab';
import { EmailNotificationsTab } from '@/components/admin/email/EmailNotificationsTab';
import { EmailInboxTab } from '@/components/admin/email/EmailInboxTab';

export function AdminEmailSection() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-navy">Email Management</h2>
        <p className="text-muted-foreground">Manage platform emails, templates, campaigns, and settings.</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50 hidden md:inline-flex rounded-lg">
          <TabsTrigger value="overview" className="flex-shrink-0 gap-2"><BarChart3 className="w-4 h-4" /> Overview</TabsTrigger>
          <TabsTrigger value="compose" className="flex-shrink-0 gap-2"><Send className="w-4 h-4" /> Compose</TabsTrigger>
          <TabsTrigger value="inbox" className="flex-shrink-0 gap-2"><Mail className="w-4 h-4" /> Inbox</TabsTrigger>
          <TabsTrigger value="templates" className="flex-shrink-0 gap-2"><LayoutTemplate className="w-4 h-4" /> Templates</TabsTrigger>
          <TabsTrigger value="automations" className="flex-shrink-0 gap-2"><Clock className="w-4 h-4" /> Automations</TabsTrigger>
          <TabsTrigger value="notifications" className="flex-shrink-0 gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="campaigns" className="flex-shrink-0 gap-2"><Send className="w-4 h-4" /> Campaigns</TabsTrigger>
          <TabsTrigger value="subscribers" className="flex-shrink-0 gap-2"><Users className="w-4 h-4" /> Subscribers</TabsTrigger>
          <TabsTrigger value="logs" className="flex-shrink-0 gap-2"><List className="w-4 h-4" /> Logs</TabsTrigger>
          <TabsTrigger value="settings" className="flex-shrink-0 gap-2"><Settings className="w-4 h-4" /> Settings</TabsTrigger>
        </TabsList>

        <div className="md:hidden mb-4">
          <select 
            className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(e) => {
              const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
              const tab = tabsList?.querySelector(`[value="${e.target.value}"]`) as HTMLElement;
              tab?.click();
            }}
          >
            <option value="overview">Overview</option>
            <option value="compose">Compose</option>
            <option value="inbox">Inbox</option>
            <option value="templates">Templates</option>
            <option value="automations">Automations</option>
            <option value="notifications">Notifications</option>
            <option value="campaigns">Campaigns</option>
            <option value="subscribers">Subscribers</option>
            <option value="logs">Logs</option>
            <option value="settings">Settings</option>
          </select>
        </div>

        <div className="mt-6">
          <TabsContent value="overview"><EmailOverviewTab /></TabsContent>
          <TabsContent value="compose"><EmailComposeTab /></TabsContent>
          <TabsContent value="inbox"><EmailInboxTab /></TabsContent>
          <TabsContent value="templates"><EmailTemplatesTab /></TabsContent>
          <TabsContent value="automations"><EmailAutomationsTab /></TabsContent>
          <TabsContent value="notifications"><EmailNotificationsTab /></TabsContent>
          <TabsContent value="campaigns"><EmailCampaignsTab /></TabsContent>
          <TabsContent value="subscribers"><EmailSubscribersTab /></TabsContent>
          <TabsContent value="logs"><EmailLogsTab /></TabsContent>
          <TabsContent value="settings"><EmailSettingsTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
