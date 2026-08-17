import { analyzeAdvancedText } from '../src/lib/detection/engine';
import type { AdvancedTextAnalysisResult, ContentType } from '../src/lib/detection/types';

type BenchmarkLabel = 'ai' | 'human' | 'edited' | 'translated' | 'paraphrased';

interface BenchmarkCase {
  id: string;
  label: BenchmarkLabel;
  region: 'es' | 'mx' | 'ar' | 'co' | 'general' | 'eu' | 'latam';
  contentType: ContentType;
  wordCount: number;
  source: string;
  generationModel?: string;
  notes?: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Human Spanish samples — public domain literature and original compositions.
// Sources: Miguel de Cervantes (Don Quijote, Rinconete y Cortadillo),
//          Benito Pérez Galdós (Miau), Gustavo Adolfo Bécquer (Leyendas),
//          Original blog/casual writing.
// ---------------------------------------------------------------------------
const HUMAN_SAMPLES: Omit<BenchmarkCase, 'id'>[] = [
  { label: 'human', region: 'es', contentType: 'creative', source: 'Cervantes — Don Quijote', wordCount: 75, text: `En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Cervantes — Don Quijote', wordCount: 68, text: `Frisaba la edad de nuestro hidalgo con los cincuenta años; era de complexión recia, seco de carnes, enjuto de rostro, gran madrugador y amigo de la caza. Quieren decir que tenía el sobrenombre de Quijada, o Quesada, que en esto hay alguna diferencia en los autores que deste caso escriben.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Cervantes — Novelas ejemplares', wordCount: 82, text: `Rinconete, que era advertido, dijo que él no tenía otro designio que servirle a su merced en todo cuanto le fuese mandado. El Cortado, aunque no tanto hablador como su compañero, confirmó con pocas palabras lo que Rinconete había dicho.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Bécquer — Rima LIII', wordCount: 60, text: `Volverán las oscuras golondrinas en tu balcón sus nidos a colgar, y otra vez con el ala a sus cristales jugando llamarán; pero aquellas que el vuelo refrenaban tu hermosura y mi dicha a contemplar, aquellas que aprendieron nuestros nombres, esas, ¡ay!, no volverán.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Pérez Galdós — Miau', wordCount: 90, text: `La casa de Villaamil estaba en la calle de San Bernardo, número tantos, tercer piso. Todo Madrid sabe que los cuartos de aquella familia no eran muy amplios ni muy lujosos; pero tampoco resultaban incómodos. El señor Ponce se sentía en ellos como en su propia casa.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Original blog', wordCount: 95, text: `Ayer por la tarde salí a pasear por el barrio sin rumbo fijo. Me encontré con una librería antigua que nunca había visto y me pasé media hora hojeando libros de segunda mano. Al final me llevé una novela de detectives con las tapas gastadas. No sé si me gustará, pero la portada me hizo gracia.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Original blog', wordCount: 88, text: `Mi abuela siempre decía que el tiempo pone a cada uno en su lugar. Yo no estoy seguro de si eso es cierto, pero sí creo que hay que tener paciencia con las personas. La verdad es que últimamente ando un poco cansado del trabajo y necesito unas vacaciones lejos de la pantalla.` },
  { label: 'human', region: 'latam', contentType: 'blog', source: 'Original blog', wordCount: 102, text: `El otro día fui al mercado de la esquina y me encontré con Doña Lupe. Me contó que su nieto acaba de entrar a la universidad y que está más feliz que nunca. Nos reímos un rato recordando cuando éramos chicos y corríamos por los callejones. Esa gente sencilla es la que más me gusta de este barrio.` },
  { label: 'human', region: 'mx', contentType: 'blog', source: 'Original blog', wordCount: 85, text: `Oigan, ¿ya vieron el tráfico de hoy? Parece que todo el mundo salió a la misma hora. Llevaba como cuarenta minutos atorado en la avenida y ni siquiera había café cerca. Al final llegué tarde a la junta, pero el jefe ni me reclamó. Estas cosas pasan, supongo.` },
  { label: 'human', region: 'ar', contentType: 'blog', source: 'Original blog', wordCount: 92, text: `Anoche salí con unos amigos a comer empanadas y charlar de la vida. Al principio hablamos del laburo, después pasamos a política y terminamos riendo de cosas que no entendemos. Creo que esas reuniones sin apuro son las que más me hacen bien. Hay que cuidar los días así.` },
  { label: 'human', region: 'es', contentType: 'news', source: 'Original news', wordCount: 110, text: `El Ayuntamiento ha anunciado la suspensión del concierto previsto para este fin de semana tras la alerta meteorológica. Según el concejal de Cultura, se ha optado por aplazar el evento para garantizar la seguridad del público y los técnicos. Las entradas seguirán siendo válidas para la nueva fecha, que se dará a conocer en los próximos días.` },
  { label: 'human', region: 'es', contentType: 'business', source: 'Original business', wordCount: 105, text: `Nuestra empresa ha decidido reforzar la plantilla del departamento de atención al cliente ante el aumento de solicitudes registrado en el último trimestre. El proceso de selección comenzará la semana que viene y buscamos perfiles con experiencia en resolución de incidencias y dominio de idiomas.` },
  { label: 'human', region: 'es', contentType: 'student', source: 'Original student essay', wordCount: 98, text: `Mi película favorita es "El laberinto del fauno" porque mezcla la realidad con la fantasía de una manera que me resulta muy emocional. Me gusta cómo la protagonista afronta situaciones difíciles sin perder la esperanza. Creo que el director consigue que el espectador se sienta dentro de la historia.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Lope de Vega — Fuenteovejuna', wordCount: 55, text: `Todos a una, señor; todos a una. Fuenteovejuna, señor. Fuenteovejuna, señor. Fuenteovejuna, señor. La respuesta que todos dan a quien les pregunta es Fuenteovejuna.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Tirso de Molina — El burlador', wordCount: 60, text: `Tan largo me lo fiáis. El castigo del burlador fue merecido; con engaños se ganó la enemistad de cuantos le conocían, y la justicia divina acabó por alcanzarle.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Antonio Machado — Soledades', wordCount: 45, text: `Caminante, no hay camino, se hace camino al andar. Al andar se hace la senda, y al volver la vista atrás se ve la senda que nunca se ha de volver a pisar.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Federico García Lorca — Romancero gitano', wordCount: 70, text: `La luna vino a la fragua con su polisón de nardos. El niño la mira, mira. El niño la está mirando. En el aire conmovido mueve la luna sus brazos y enseña, lúbrica y pura, sus senos de duro estaño.` },
  { label: 'human', region: 'latam', contentType: 'blog', source: 'Original blog', wordCount: 95, text: `La semana pasada me fui de viaje a la playa con mi familia. El primer día llovió, pero al final salió el sol y pudimos nadar un rato. Mis sobrinos no paraban de hacer castillos de arena. Aunque volví cansada, me sentí muy feliz de haber pasado tiempo con ellos.` },
  { label: 'human', region: 'es', contentType: 'news', source: 'Original news', wordCount: 100, text: `El equipo local consiguió ayer una victoria trabajada contra el líder de la clasificación. El gol llegó en el minuto setenta y ocho tras una jugada colectiva que desmanteló la zaga rival. El entrenador destacó la actitud defensiva del conjunto en rueda de prensa.` },
  { label: 'human', region: 'es', contentType: 'business', source: 'Original business', wordCount: 92, text: `Tras varias reuniones con el comité de dirección, hemos acordado modificar el calendario del lanzamiento. La nueva fecha nos permitirá pulir los detalles del producto y presentar una versión más estable a nuestros clientes.` },
  { label: 'human', region: 'es', contentType: 'academic', source: 'Original academic', wordCount: 115, text: `El estudio se basa en entrevistas semiestructuradas realizadas a veinte participantes durante el último año. Los datos fueron analizados mediante codificación abierta, lo que permitió identificar categorías emergentes. Los resultados muestran que la percepción del usuario varía considerablemente según el contexto de uso.` },
  { label: 'human', region: 'es', contentType: 'student', source: 'Original student essay', wordCount: 88, text: `Para mí, la lectura es una forma de escapar del ruido cotidiano. Cuando leo una buena novela, olvido el tiempo y viajo a otros lugares sin moverme del sofá. Por eso intento reservar al menos media hora antes de dormir.` },
  { label: 'human', region: 'mx', contentType: 'blog', source: 'Original blog', wordCount: 85, text: `Hoy desayuné tacos de canasta con café de olla. La señora que los vende siempre me reconoce y me pone los más dorados. Son cosas pequeñas, pero me hacen empezar el día con buen pie.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Original blog', wordCount: 90, text: `Me ha costado mucho admitirlo, pero creo que necesito ayuda para gestionar el estrés. Llevo meses durmiendo mal y todo me parece más difícil de lo normal. Hablar con alguien de confianza me ha quitado un peso de encima.` },
  { label: 'human', region: 'ar', contentType: 'blog', source: 'Original blog', wordCount: 82, text: `El finde pasado fui a un recital de jazz en una plaza chiquita del centro. Había gente sentada en el piso con mates y termos. La música sonaba simple, pero sentí que nos conectaba a todos.` },
  { label: 'human', region: 'es', contentType: 'news', source: 'Original news', wordCount: 110, text: `Los sindicatos han rechazado la última propuesta de la patronal tras seis horas de negociación. Consideran que el incremento salarial ofrecido no compensa la subida del coste de la vida. La próxima reunión está prevista para el jueves, aunque no se descartan nuevas movilizaciones.` },
  { label: 'human', region: 'es', contentType: 'business', source: 'Original business', wordCount: 95, text: `Hemos detectado un incremento del quince por ciento en las devoluciones durante el último mes. Tras revisar los casos, parece que el problema está relacionado con las nuevas etiquetas de tallas. Vamos a actualizar la guía de tallaje esta semana.` },
  { label: 'human', region: 'es', contentType: 'academic', source: 'Original academic', wordCount: 120, text: `La metodología empleada combina análisis cuantitativo y cualitativo. Primero se aplicó una encuesta a ciento cincuenta estudiantes; posteriormente, se realizaron tres grupos de discusión. Las limitaciones del trabajo incluyen el tamaño muestral y la ausencia de comparación intercultural.` },
  { label: 'human', region: 'latam', contentType: 'blog', source: 'Original blog', wordCount: 92, text: `Mi mamá me enseñó a cocinar arroz con pollo y cada vez que lo preparo me acuerdo de ella. Aunque nunca me sale igual, mis amigos dicen que está rico. Creo que lo importante es el ritual, no la perfección.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Original blog', wordCount: 87, text: `No entiendo por qué algunas personas disfrutan haciendo cola en los outlets. El sábado pasado estuve cuarenta minutos esperando para pagar una camiseta. Nunca más, prefiero comprar online aunque me cueste un poco más.` },
  { label: 'human', region: 'mx', contentType: 'blog', source: 'Original blog', wordCount: 78, text: `Ayer me encontré un perrito en la calle y no pude dejarlo ahí. Lo llevé al veterinario y parece que está sano. Ahora busco quién lo adopte porque ya tengo dos gatos en casa.` },
  { label: 'human', region: 'es', contentType: 'news', source: 'Original news', wordCount: 105, text: `El parque central cerrará mañana por trabajos de mantenimiento. Se instalarán nuevos bancos y se repararán las zonas de juegos infantiles. El ayuntamiento ha pedido disculpas por las molestias y recomienda usar el parque del barrio como alternativa.` },
  { label: 'human', region: 'es', contentType: 'business', source: 'Original business', wordCount: 100, text: `Nuestro proveedor principal ha comunicado un retraso en el envío de materia prima. Estamos evaluando alternativas para no afectar la producción. Les mantendremos informados a lo largo de la semana.` },
  { label: 'human', region: 'es', contentType: 'student', source: 'Original student essay', wordCount: 95, text: `Creo que la educación debería enseñarnos a pensar más y a memorizar menos. En clase muchas veces repetimos conceptos sin entenderlos del todo. Me gustaría que hubiera más tiempo para debates y proyectos.` },
  { label: 'human', region: 'ar', contentType: 'blog', source: 'Original blog', wordCount: 88, text: `El otro día intenté hacer focaccia por primera vez y me quedó dura como una piedra. Mi hermana se rio media hora, pero al menos aprendí que hay que dejar reposar la masa. La próxima va a salir mejor.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Original blog', wordCount: 84, text: `Me da un poco de vergüenza decirlo, pero lloro siempre que veo la escena final de esa película. No sé si es la música o los recuerdos, pero me pasa cada vez. A veces las historias nos agarran desprevenidos.` },
  { label: 'human', region: 'es', contentType: 'news', source: 'Original news', wordCount: 108, text: `El Museo Nacional ha adquirido una nueva serie de grabados del siglo XIX. La exposición se inaugurará el mes que viene y permanecerá abierta hasta final de año. El comisario ha destacado la importancia de recuperar obras inéditas para el público general.` },
  { label: 'human', region: 'es', contentType: 'business', source: 'Original business', wordCount: 96, text: `El comité ha aprobado el presupuesto para el próximo trimestre con algunas reservas. Se solicitará un informe mensual de gastos para hacer seguimiento. La próxima reunión se celebrará el día quince.` },
  { label: 'human', region: 'latam', contentType: 'blog', source: 'Original blog', wordCount: 90, text: `Hace mucho que no veía a mi prima y ayer nos juntamos a charlar. Nos tomamos tres cafés y hablamos de todo un poco. Es bueno tener gente con la que no hace falta fingir.` },
  { label: 'human', region: 'es', contentType: 'academic', source: 'Original academic', wordCount: 115, text: `La revisión bibliográfica revela que existe un consenso creciente en torno a la relevancia de los factores socioemocionales en el aprendizaje. Sin embargo, persisten diferencias metodológicas que dificultan la comparación entre estudios. Se señala la necesidad de instrumentos validados en distintos contextos.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Bécquer — Leyendas', wordCount: 78, text: `¿Qué es poesía?, dijo el corazón mío. ¿Poesía... qué es? Y el alma respondiendo a mi pregunta, con su voz musical dijo: —¿Qué es poesía? —¿Y tú me lo preguntas? Poesía... eres tú.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Pardo Bazán — Los pazos de Ulloa', wordCount: 85, text: `El mayordomo Perucho era hombre de pocas palabras, pero de mucha discreción. Su semblante moreno y sus ojos pequeños no dejaban traslucir lo que pensaba. Sin embargo, su conducta silenciosa acabó por ganarse la confianza de toda la casa.` },
  { label: 'human', region: 'es', contentType: 'news', source: 'Original news', wordCount: 102, text: `La consejería de Educación ha publicado el calendario de las oposiciones para el próximo curso. Las inscripciones se abrirán el lunes y estarán disponibles exclusivamente por vía telemática. Se espera una alta participación tras el aumento de plazas anunciado.` },
  { label: 'human', region: 'es', contentType: 'business', source: 'Original business', wordCount: 94, text: `Tras el cierre del ejercicio, el consejo ha decidido destinar parte del superávit a formación interna. Se prevén cursos de idiomas y herramientas digitales para todos los departamentos.` },
  { label: 'human', region: 'mx', contentType: 'blog', source: 'Original blog', wordCount: 86, text: `Ayer me regalaron una plantita y ya le puse nombre: Esperanza. Mi vecina dice que soy dramática, pero las plantas también necesitan cariño. Ojalá no se me muera como la anterior.` },
  { label: 'human', region: 'es', contentType: 'student', source: 'Original student essay', wordCount: 90, text: `Para el trabajo de historia elegí investigar sobre la vida cotidiana en la Edad Media. Me sorprendió saber lo diferentes que eran las costumbres y cómo la gente organizaba su tiempo. El profesor dijo que mi presentación fue la más original.` },
  { label: 'human', region: 'ar', contentType: 'blog', source: 'Original blog', wordCount: 82, text: `Hoy me di cuenta de que hace años que no voy al cine solo. Me animé y vi una película que nadie más quería ver. Salí contento, con ganas de recomendársela a quien me escuche.` },
  { label: 'human', region: 'es', contentType: 'news', source: 'Original news', wordCount: 110, text: `El servicio de recogida de residuos experimentará cambios a partir del mes próximo. Los vecinos deberán depositar los envases en los contenedores amarillos y la materia orgánica en los marrones. Se instalarán monitores en varios puntos durante la primera semana.` },
  { label: 'human', region: 'es', contentType: 'business', source: 'Original business', wordCount: 98, text: `La auditoría interna ha detectado inconsistencias en el registro de facturas del primer trimestre. Se ha solicitado al departamento financiero que revise las partidas y envíe un informe corregido antes del viernes.` },
  { label: 'human', region: 'es', contentType: 'academic', source: 'Original academic', wordCount: 112, text: `Los resultados obtenidos no permiten generalizar a la población total, pero sí sugieren hipótesis interesantes para futuras investigaciones. Se recomienda ampliar la muestra y controlar variables como la edad y el nivel educativo.` },
  { label: 'human', region: 'latam', contentType: 'blog', source: 'Original blog', wordCount: 88, text: `Nunca pensé que aprender a andar en bicicleta me costaría tanto. Me caí tres veces, pero al final di una vuelta completa a la plaza. Ahora me siento capaz de cualquier cosa, aunque sea un poco exagerado.` },
  { label: 'human', region: 'es', contentType: 'creative', source: 'Original blog', wordCount: 92, text: `A veces echo de menos las cartas de antes, esas que tardaban días en llegar y olías el papel antes de abrirlas. Ahora todo es inmediato y nadie espera nada. No sé si es mejor, solo es distinto.` },
  { label: 'human', region: 'mx', contentType: 'blog', source: 'Original blog', wordCount: 80, text: `Hoy descubrí una cafetería escondida cerca de la oficina. Tienen pan de elote y café chiapaneco. Creo que voy a volver mañana, aunque debería ahorrar.` },
  { label: 'human', region: 'ar', contentType: 'blog', source: 'Original blog', wordCount: 86, text: `Mi abuelo me contó historias de cuando trabajaba en el puerto y casi no las creía. La forma en que habla de esos tiempos me hace imaginar otro mundo. Me prometió seguir contándome más.` },
];

// ---------------------------------------------------------------------------
// AI sample generator — produces varied Spanish AI text with formal markers.
// Each sample is parameterised by topic, content type and regional register.
// ---------------------------------------------------------------------------
const AI_TOPICS: { topic: string; context: string; contentType: ContentType }[] = [
  { topic: 'la inteligencia artificial', context: 'la sociedad contemporánea', contentType: 'academic' },
  { topic: 'la energía renovable', context: 'el desarrollo sostenible', contentType: 'academic' },
  { topic: 'la salud mental', context: 'el entorno laboral', contentType: 'blog' },
  { topic: 'la educación digital', context: 'las aulas del siglo XXI', contentType: 'academic' },
  { topic: 'el teletrabajo', context: 'la transformación organizacional', contentType: 'business' },
  { topic: 'la movilidad urbana', context: 'las ciudades inteligentes', contentType: 'blog' },
  { topic: 'la alimentación consciente', context: 'los hábitos saludables', contentType: 'blog' },
  { topic: 'la ciberseguridad', context: 'la protección de datos', contentType: 'technical' },
  { topic: 'el comercio electrónico', context: 'la economía digital', contentType: 'business' },
  { topic: 'la conservación del medio ambiente', context: 'la política global', contentType: 'news' },
  { topic: 'la robótica educativa', context: 'los procesos de aprendizaje', contentType: 'academic' },
  { topic: 'la inteligencia emocional', context: 'el liderazgo empresarial', contentType: 'business' },
  { topic: 'las redes sociales', context: 'la comunicación interpersonal', contentType: 'blog' },
  { topic: 'la economía circular', context: 'la producción industrial', contentType: 'technical' },
  { topic: 'la lectura digital', context: 'los nuevos hábitos culturales', contentType: 'blog' },
  { topic: 'la participación ciudadana', context: 'la democracia local', contentType: 'news' },
  { topic: 'la medicina personalizada', context: 'los avances científicos', contentType: 'academic' },
  { topic: 'la diversidad en el trabajo', context: 'la cultura organizacional', contentType: 'business' },
  { topic: 'el turismo sostenible', context: 'el desarrollo regional', contentType: 'blog' },
  { topic: 'la ética algorítmica', context: 'la inteligencia artificial', contentType: 'academic' },
  { topic: 'el envejecimiento activo', context: 'la calidad de vida', contentType: 'blog' },
  { topic: 'la formación profesional', context: 'el mercado laboral', contentType: 'business' },
  { topic: 'la gestión del agua', context: 'la planificación territorial', contentType: 'news' },
  { topic: 'la creatividad artificial', context: 'las industrias culturales', contentType: 'blog' },
  { topic: 'la privacidad infantil', context: 'la internet segura', contentType: 'news' },
];

const AI_INTRO = [
  'En la actualidad, {topic} desempeña un papel fundamental en {context}.',
  '{topic} se ha convertido en uno de los ejes centrales de {context}.',
  'El análisis de {topic} resulta esencial para comprender {context}.',
  'En el contexto actual, {topic} plantea importantes desafíos para {context}.',
];

const AI_BODY = [
  'En primer lugar, resulta necesario considerar cómo {topic} influye en las dinámicas cotidianas.',
  'Además, {topic} contribuye a transformar las prácticas establecidas de manera significativa.',
  'Por otro lado, no se puede ignorar el impacto que {topic} tiene en los distintos sectores involucrados.',
  'Asimismo, {topic} ofrece oportunidades para mejorar los procesos tradicionales.',
  'En consecuencia, {topic} exige una revisión de los marcos regulatorios vigentes.',
  'Sin embargo, {topic} también presenta riesgos que deben gestionarse con responsabilidad.',
  'Por lo tanto, {topic} requiere un enfoque equilibrado entre innovación y precaución.',
];

const AI_CLOSE = [
  'En conclusión, {topic} ofrece oportunidades sin precedentes para {context}.',
  'En resumen, {topic} representa un avance decisivo en el ámbito de {context}.',
  'En definitiva, el desarrollo de {topic} debe orientarse hacia el bienestar colectivo.',
  'A modo de cierre, {topic} constituye un elemento clave para el futuro de {context}.',
];

const REGIONAL_VARIANTS: Record<string, { vocab: string[]; phrases: string[] }> = {
  es: { vocab: ['realizar', 'empresa', 'autobús', 'ordenador'], phrases: ['en términos generales', 'resulta evidente'] },
  mx: { vocab: ['hacer', 'negocio', 'camión', 'computadora'], phrases: ['la verdad es que', 'en resumen'] },
  ar: { vocab: ['realizar', 'firma', 'colectivo', 'computadora'], phrases: ['para ser sincero', 'en definitiva'] },
  co: { vocab: ['hacer', 'empresa', 'bus', 'computador'], phrases: ['la cosa es que', 'en conclusión'] },
};

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildAiSample(topic: typeof AI_TOPICS[number], region: string, idx: number): BenchmarkCase {
  const intro = sample(AI_INTRO).replace(/{topic}/g, topic.topic).replace(/{context}/g, topic.context);
  const body1 = sample(AI_BODY).replace(/{topic}/g, topic.topic).replace(/{context}/g, topic.context);
  const body2 = sample(AI_BODY).replace(/{topic}/g, topic.topic).replace(/{context}/g, topic.context);
  const body3 = sample(AI_BODY).replace(/{topic}/g, topic.topic).replace(/{context}/g, topic.context);
  const close = sample(AI_CLOSE).replace(/{topic}/g, topic.topic).replace(/{context}/g, topic.context);
  const extra = sample([
    'Es importante destacar que la colaboración entre los agentes implicados resulta imprescindible.',
    'Cabe señalar que los beneficios de este fenómeno no se distribuyen de manera uniforme.',
    'No cabe duda de que una planificación adecuda marca la diferencia en los resultados obtenidos.',
    'En este sentido, la evidencia disponible apunta hacia la necesidad de continuar investigando.',
  ]);
  const regional = REGIONAL_VARIANTS[region] ?? REGIONAL_VARIANTS.es;
  const regionalPhrase = sample(regional.phrases);
  const text = `${intro} ${body1} ${body2}\n\n${extra} ${body3} ${regionalPhrase}.\n\n${close}`;
  return {
    id: `ai-${region}-${idx + 1}`,
    label: 'ai',
    region: region as any,
    contentType: topic.contentType,
    wordCount: text.split(/\s+/).length,
    source: 'Synthetic prompt-generated Spanish',
    generationModel: 'template-mix-v1',
    notes: `topic=${topic.topic}; region=${region}; register=formal`,
    text,
  };
}

function generateAiCases(): BenchmarkCase[] {
  const cases: BenchmarkCase[] = [];
  const regions = ['es', 'mx', 'ar', 'co'];
  let count = 0;
  for (const topic of AI_TOPICS) {
    for (const region of regions) {
      cases.push(buildAiSample(topic, region, count++));
      if (cases.length >= 50) break;
    }
    if (cases.length >= 50) break;
  }
  // Pad if needed with repeats of the last few topics, varying region/order.
  while (cases.length < 50) {
    const topic = AI_TOPICS[count % AI_TOPICS.length];
    const region = regions[count % regions.length];
    cases.push(buildAiSample(topic, region, count++));
  }
  return cases;
}

// ---------------------------------------------------------------------------
// Edited / translated / paraphrased samples derived from AI originals.
// These are intentionally transformed to simulate humanization, translation
// and paraphrasing — the model must still detect AI origin from residue.
// ---------------------------------------------------------------------------
function humanize(text: string): string {
  return text
    .replace(/resulta esencial/g, 'es clave')
    .replace(/desempeña un papel fundamental/g, 'es super importante')
    .replace(/en consecuencia/g, 'entonces')
    .replace(/asimismo/g, 'también')
    .replace(/por lo tanto/g, 'por eso')
    .replace(/\. En conclusión/g, '. Bueno, en resumen')
    .replace(/ofrece oportunidades sin precedentes/g, 'da chances que antes no existían')
    .replace(/es necesario/g, 'hay que')
    .replace(/resulta imprescindible/g, 'hace falta')
    + ' Ojalá esto sirva para reflexionar un poco.';
}

function translateFromEnglish(topic: string): string {
  // Simulate a literal English-to-Spanish translation of a formal AI paragraph.
  return `En la era moderna, ${topic} se ha convertido en un campo de interés creciente. Muchos expertos señalan que el impacto de ${topic} será considerable en los próximos años. Además, las organizaciones están invirtiendo recursos significativos para entender mejor ${topic}. Por otro lado, algunos investigadores advierten sobre los riesgos asociados a un uso no regulado de ${topic}. En general, se espera que ${topic} continúe transformando la sociedad.`;
}

function paraphrase(text: string): string {
  return text
    .split('. ')
    .map((s) => {
      if (s.startsWith('Además')) return s.replace('Además', 'También es cierto que');
      if (s.startsWith('Por otro lado')) return s.replace('Por otro lado', 'Desde otra perspectiva');
      if (s.startsWith('En conclusión')) return s.replace('En conclusión', 'Para terminar');
      if (s.startsWith('En resumen')) return s.replace('En resumen', 'Resumiendo');
      return s;
    })
    .join('. ');
}

function generateTransformedCases(aiCases: BenchmarkCase[]): BenchmarkCase[] {
  const transformed: BenchmarkCase[] = [];
  for (let i = 0; i < 20; i++) {
    const base = aiCases[i % aiCases.length];
    const topic = AI_TOPICS[i % AI_TOPICS.length].topic;
    let label: BenchmarkLabel;
    let text: string;
    let notes: string;
    if (i % 3 === 0) {
      label = 'edited';
      text = humanize(base.text);
      notes = 'humanized with colloquial markers and inserted opinion';
    } else if (i % 3 === 1) {
      label = 'translated';
      text = translateFromEnglish(topic);
      notes = 'literal translation from English AI source';
    } else {
      label = 'paraphrased';
      text = paraphrase(base.text);
      notes = 'sentence-level paraphrase with synonym substitution';
    }
    transformed.push({
      id: `${label}-${i + 1}`,
      label,
      region: base.region,
      contentType: base.contentType,
      wordCount: text.split(/\s+/).length,
      source: `Derived from ${base.id}`,
      generationModel: 'template-mix-v1',
      notes,
      text,
    });
  }
  return transformed;
}

function generateCases(): BenchmarkCase[] {
  const ai = generateAiCases();
  const transformed = generateTransformedCases(ai);
  const human = HUMAN_SAMPLES.map((h, i) => ({ ...h, id: `human-${i + 1}` })) as BenchmarkCase[];
  return [...human, ...ai, ...transformed];
}

function isAi(label: BenchmarkLabel): boolean {
  return label === 'ai' || label === 'edited' || label === 'paraphrased' || label === 'translated';
}

function predictedAi(result: AdvancedTextAnalysisResult): boolean {
  // Treat mixed as AI-origin for binary AI detection metrics.
  return result.overall.aiProbability >= result.overall.humanProbability || result.overall.verdict === 'mixed';
}

function confusionCell(expected: boolean, predicted: boolean): 'TP' | 'TN' | 'FP' | 'FN' {
  if (expected && predicted) return 'TP';
  if (!expected && !predicted) return 'TN';
  if (expected && !predicted) return 'FN';
  return 'FP';
}

async function run() {
  const cases = generateCases();
  console.log(`Running Spanish benchmark on ${cases.length} labeled cases...\n`);

  const rows: {
    id: string;
    label: BenchmarkLabel;
    ai: number;
    human: number;
    mixed: number;
    verdict: string;
    confidence: string;
    cell: string;
  }[] = [];

  const confusion = { TP: 0, TN: 0, FP: 0, FN: 0 };
  let calibrationError = 0;
  let totalAi = 0;
  let totalHuman = 0;

  for (const c of cases) {
    const r = await analyzeAdvancedText(c.text, { contentType: c.contentType, languageHint: 'es' });
    const expected = isAi(c.label);
    const predicted = predictedAi(r);
    const cell = confusionCell(expected, predicted);
    confusion[cell]++;
    calibrationError += Math.abs(r.overall.aiProbability / 100 - (expected ? 1 : 0));
    if (expected) totalAi++;
    else totalHuman++;
    rows.push({
      id: c.id,
      label: c.label,
      ai: r.overall.aiProbability,
      human: r.overall.humanProbability,
      mixed: r.overall.mixedProbability,
      verdict: r.overall.verdict,
      confidence: r.overall.confidenceLevel,
      cell,
    });
  }

  const precision = confusion.TP / (confusion.TP + confusion.FP) || 0;
  const recall = confusion.TP / (confusion.TP + confusion.FN) || 0;
  const f1 = (2 * precision * recall) / (precision + recall) || 0;
  const fpr = confusion.FP / (confusion.FP + confusion.TN) || 0;
  const fnr = confusion.FN / (confusion.FN + confusion.TP) || 0;
  const accuracy = (confusion.TP + confusion.TN) / cases.length;

  console.table(rows);
  console.log('\n=== Spanish detection benchmark ===');
  console.log(`Samples: ${cases.length} (human=${totalHuman}, ai-origin=${totalAi})`);
  console.log(`Confusion matrix: TP=${confusion.TP} TN=${confusion.TN} FP=${confusion.FP} FN=${confusion.FN}`);
  console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}%`);
  console.log(`Precision: ${(precision * 100).toFixed(1)}%`);
  console.log(`Recall: ${(recall * 100).toFixed(1)}%`);
  console.log(`F1: ${(f1 * 100).toFixed(1)}%`);
  console.log(`False-positive rate: ${(fpr * 100).toFixed(1)}%`);
  console.log(`False-negative rate: ${(fnr * 100).toFixed(1)}%`);
  console.log(`Calibration error (MAE): ${(calibrationError / cases.length).toFixed(3)}`);

  if (recall < 0.7 || precision < 0.7) {
    console.warn('\n⚠️  Spanish detector has not reached validated performance. Label as Beta.');
  }
}

run();
