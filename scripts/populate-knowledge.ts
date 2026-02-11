import { embed } from "ai";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { openai } from "@/lib/ai/openai";
import { documents } from "../lib/db/schema";

// Load environment variables
config({ path: ".env.development.local" });
config({ path: ".env.local" });
config({ path: ".env" });

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

async function addDocument(content: string, url: string, metadata: any = {}) {
  try {
    // Create embedding
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: content,
    });

    // Insert into database
    await db.insert(documents).values({
      content,
      url,
      embedding: embedding as any, // Cast to any for custom vector type
      metadata: JSON.stringify(metadata),
    });

    console.log(`✅ Added: ${metadata.type || url}`);
  } catch (error) {
    console.error(`❌ Failed to add document:`, error);
  }
}

async function populateKnowledgeBase() {
  console.log("🚀 Starting knowledge base population...\n");

  // Enable pgvector extension
  try {
    await client.unsafe("CREATE EXTENSION IF NOT EXISTS vector");
    console.log("✅ pgvector extension enabled\n");
  } catch (_error) {
    console.log("⚠️  pgvector extension may already exist\n");
  }

  // Services Overview
  await addDocument(
    `New York English Teacher offers personalized English coaching for executives and business professionals. 
    Services include:
    - 1-on-1 Coaching: Personalized lessons aligned with real-world business challenges. Lessons are built around your job and specific goals.
    - Corporate Training: Individual coaching for teams and executives to improve Business English communication.
    - Interview Preparation: Mock interviews with targeted feedback on pronunciation, phrasing, and tone.
    - Business Presentations: Hands-on practice with structure templates and real presentation scenarios.
    
    A free 30-minute coaching session is available to start.`,
    "https://www.nyenglishteacher.com",
    { type: "services-overview", language: "en" },
  );

  // Target Audience
  await addDocument(
    `Target clients for New York English Teacher:
    - Executives and business professionals who need to communicate effectively in English
    - Professionals preparing for interviews, client meetings, or presentations
    - Companies wanting to train their teams in Business English
    - Spanish speakers building confidence in English business communication
    - Entrepreneurs and business leaders who need practical, real-world English skills
    
    The coaching is NOT academic English - it's focused on practical business communication.`,
    "https://www.nyenglishteacher.com",
    { type: "target-audience", language: "en" },
  );

  // Coaching Approach
  await addDocument(
    `New York English Teacher's coaching approach:
    - Lessons built around the client's job and specific professional goals
    - Clear, on-the-spot feedback on pronunciation, phrasing, and tone
    - Practice real business tasks: presentations, client calls, reports, emails
    - Structured yet flexible approach tailored to professional needs
    - Focus on building confidence for business meetings and presentations
    - Helps with career advancement through better English communication
    
    Proven results with executives from companies like CEVA Logistics, Driscoll's, and Smarttie.`,
    "https://www.nyenglishteacher.com",
    { type: "coaching-approach", language: "en" },
  );

  // Pricing Information
  await addDocument(
    `Pricing for New York English Teacher services:
    - Pricing details are discussed during the free 30-minute consultation
    - The consultation helps determine the best coaching plan for your specific needs
    - Flexible packages available for individuals and corporate teams
    - Investment varies based on coaching frequency and specific goals
    
    To learn about pricing, book a free 30-minute coaching session to discuss your needs.`,
    "https://www.nyenglishteacher.com",
    { type: "pricing", language: "en" },
  );

  // Spanish Version - Services
  await addDocument(
    `New York English Teacher ofrece coaching personalizado de inglés para ejecutivos y profesionales de negocios.
    Los servicios incluyen:
    - Coaching 1-a-1: Lecciones personalizadas alineadas con desafíos empresariales del mundo real.
    - Capacitación Corporativa: Coaching individual para equipos y ejecutivos.
    - Preparación para Entrevistas: Entrevistas simuladas con retroalimentación específica.
    - Presentaciones de Negocios: Práctica práctica con plantillas de estructura.
    
    Hay disponible una sesión de coaching gratuita de 30 minutos para comenzar.`,
    "https://www.nyenglishteacher.com",
    { type: "services-overview", language: "es" },
  );

  // Spanish Version - Target Audience
  await addDocument(
    `Clientes objetivo de New York English Teacher:
    - Ejecutivos y profesionales de negocios que necesitan comunicarse en inglés
    - Profesionales que se preparan para entrevistas, reuniones con clientes o presentaciones
    - Empresas que desean capacitar a sus equipos en inglés de negocios
    - Hispanohablantes que desarrollan confianza en la comunicación empresarial en inglés
    
    El coaching NO es inglés académico - está enfocado en comunicación empresarial práctica del mundo real.`,
    "https://www.nyenglishteacher.com",
    { type: "target-audience", language: "es" },
  );

  // Spanish Version - Pricing
  await addDocument(
    `Precios de los servicios de New York English Teacher:
    - Los detalles de precios se discuten durante la consulta gratuita de 30 minutos
    - La consulta ayuda a determinar el mejor plan de coaching para sus necesidades específicas
    - Paquetes flexibles disponibles para individuos y equipos corporativos
    
    Para conocer los precios, reserve una sesión de coaching gratuita de 30 minutos.`,
    "https://www.nyenglishteacher.com",
    { type: "pricing", language: "es" },
  );

  // FAQ - Levels and Backgrounds
  await addDocument(
    `What levels and backgrounds does New York English Teacher work with?
    Robert works with intermediate and advanced learners—busy professionals in business, law, medicine, logistics, engineering, and other fields. 
    He does not teach absolute beginners. The coaching is designed for professionals who already have a foundation in English and want to improve their business communication skills.`,
    "https://www.nyenglishteacher.com/en/faqs/",
    { type: "faq-levels", language: "en" },
  );

  // FAQ - Lesson Content
  await addDocument(
    `What do New York English Teacher lessons cover?
    Lessons focus on:
    - Speaking English with confidence in professional settings
    - Work scenarios: meetings, presentations, client calls
    - Pronunciation, phrasing, and professional tone
    - Interview preparation
    - General business communication skills
    
    All lessons are customized to your specific job and professional goals.`,
    "https://www.nyenglishteacher.com/en/faqs/",
    { type: "faq-content", language: "en" },
  );

  // FAQ - How Classes Work
  await addDocument(
    `How do New York English Teacher classes work?
    - Private 60-minute sessions conducted online via Google Meet
    - Each session includes: warm-up, targeted practice, on-the-spot feedback, and small talk
    - Customized PDF notes are delivered after each class
    - Lessons are personalized to your job and specific professional needs
    - Flexible scheduling available`,
    "https://www.nyenglishteacher.com/en/faqs/",
    { type: "faq-how-it-works", language: "en" },
  );

  // FAQ - Scheduling
  await addDocument(
    `How to schedule or reschedule lessons with New York English Teacher:
    - Send a message on WhatsApp
    - Email Robert directly
    - Call directly
    
    Important: Please give at least 24 hours' notice to reschedule and avoid any fees.`,
    "https://www.nyenglishteacher.com/en/faqs/",
    { type: "faq-scheduling", language: "en" },
  );

  // FAQ - Pricing Details
  await addDocument(
    `New York English Teacher pricing:
    - Students in Mexico: 500 MXN per hour
    - Students in the USA: 25 USD per hour
    - Senior leadership training: Custom pricing (contact for proposal)
    
    Payment (individuals): Due before each session via Zelle or bank transfer
    Companies: Monthly invoicing available`,
    "https://www.nyenglishteacher.com/en/faqs/",
    { type: "faq-pricing-details", language: "en" },
  );

  // FAQ - Senior Leadership
  await addDocument(
    `Does New York English Teacher offer training for senior leadership?
    Yes! Robert designs custom workshops and private coaching sessions specifically for senior leaders and executives.
    Contact him directly for a customized proposal and pricing tailored to your organization's needs.`,
    "https://www.nyenglishteacher.com/en/faqs/",
    { type: "faq-leadership", language: "en" },
  );

  // FAQ - Progress Timeline
  await addDocument(
    `How fast will I improve with New York English Teacher coaching?
    Most students see clear progress within 3-5 sessions.
    
    Improvement depends on:
    - Practice outside of class
    - Lesson frequency
    - Self-discipline
    - Your personal goals
    
    The coaching is designed to deliver practical, real-world results quickly.`,
    "https://www.nyenglishteacher.com/en/faqs/",
    { type: "faq-progress", language: "en" },
  );

  // FAQ - Cancellation Policy
  await addDocument(
    `New York English Teacher cancellation and payment policy:
    
    Attendance:
    - Robert waits up to 15 minutes after the start time
    - After 15 minutes, the lesson is considered a no-show and the fee applies
    
    Cancellations:
    - Require 24 hours' notice to avoid fees
    
    Payment:
    - Individuals: Payment due before each session via Zelle or bank transfer
    - Companies: Monthly invoicing available`,
    "https://www.nyenglishteacher.com/en/faqs/",
    { type: "faq-policy", language: "en" },
  );

  // ===========================================
  // SPANISH FAQs
  // ===========================================

  // FAQ ES - Niveles y experiencia
  await addDocument(
    `¿Con qué niveles y perfiles trabaja New York English Teacher?
    Robert trabaja con estudiantes de nivel intermedio y avanzado: profesionales ocupados en negocios, derecho, medicina, logística, ingeniería y otros campos.
    No enseña a principiantes absolutos. El coaching está diseñado para profesionales que ya tienen una base en inglés y quieren mejorar sus habilidades de comunicación empresarial.`,
    "https://www.nyenglishteacher.com/es/faqs/",
    { type: "faq-levels", language: "es" },
  );

  // FAQ ES - Contenido de las clases
  await addDocument(
    `¿Qué cubren las clases de New York English Teacher?
    Las lecciones se enfocan en:
    - Hablar inglés con confianza en entornos profesionales
    - Escenarios de trabajo: reuniones, presentaciones, llamadas con clientes
    - Pronunciación, frases y tono profesional
    - Preparación para entrevistas
    - Habilidades generales de comunicación empresarial

    Todas las lecciones están personalizadas según tu trabajo y objetivos profesionales específicos.`,
    "https://www.nyenglishteacher.com/es/faqs/",
    { type: "faq-content", language: "es" },
  );

  // FAQ ES - Cómo funcionan las clases
  await addDocument(
    `¿Cómo funcionan las clases de New York English Teacher?
    - Sesiones privadas de 60 minutos realizadas en línea por Google Meet
    - Cada sesión incluye: calentamiento, práctica dirigida, retroalimentación inmediata y conversación
    - Se entregan notas personalizadas en PDF después de cada clase
    - Las lecciones están personalizadas para tu trabajo y necesidades profesionales específicas
    - Horarios flexibles disponibles`,
    "https://www.nyenglishteacher.com/es/faqs/",
    { type: "faq-how-it-works", language: "es" },
  );

  // FAQ ES - Programación
  await addDocument(
    `¿Cómo programar o reprogramar clases con New York English Teacher?
    - Envía un mensaje por WhatsApp
    - Escribe un correo electrónico directamente a Robert
    - Llama directamente

    Importante: Por favor avisa con al menos 24 horas de anticipación para reprogramar y evitar cargos.`,
    "https://www.nyenglishteacher.com/es/faqs/",
    { type: "faq-scheduling", language: "es" },
  );

  // FAQ ES - Precios detallados
  await addDocument(
    `Precios de New York English Teacher:
    - Estudiantes en México: 500 MXN por hora
    - Estudiantes en Estados Unidos: 25 USD por hora
    - Capacitación para liderazgo senior: Precios personalizados (contactar para propuesta)

    Pago (individuos): Se paga antes de cada sesión por Zelle o transferencia bancaria
    Empresas: Facturación mensual disponible`,
    "https://www.nyenglishteacher.com/es/faqs/",
    { type: "faq-pricing-details", language: "es" },
  );

  // FAQ ES - Liderazgo Senior
  await addDocument(
    `¿New York English Teacher ofrece capacitación para liderazgo senior?
    ¡Sí! Robert diseña talleres personalizados y sesiones de coaching privadas específicamente para líderes senior y ejecutivos.
    Contáctalo directamente para una propuesta personalizada y precios adaptados a las necesidades de tu organización.`,
    "https://www.nyenglishteacher.com/es/faqs/",
    { type: "faq-leadership", language: "es" },
  );

  // FAQ ES - Tiempo de progreso
  await addDocument(
    `¿Qué tan rápido mejoraré con el coaching de New York English Teacher?
    La mayoría de los estudiantes ven progreso claro en 3-5 sesiones.

    La mejora depende de:
    - Práctica fuera de clase
    - Frecuencia de las lecciones
    - Autodisciplina
    - Tus metas personales

    El coaching está diseñado para entregar resultados prácticos y del mundo real rápidamente.`,
    "https://www.nyenglishteacher.com/es/faqs/",
    { type: "faq-progress", language: "es" },
  );

  // FAQ ES - Política de cancelación
  await addDocument(
    `Política de cancelación y pago de New York English Teacher:

    Asistencia:
    - Robert espera hasta 15 minutos después de la hora de inicio
    - Después de 15 minutos, la lección se considera inasistencia y se aplica el cargo

    Cancelaciones:
    - Requieren aviso de 24 horas para evitar cargos

    Pago:
    - Individuos: Pago antes de cada sesión por Zelle o transferencia bancaria
    - Empresas: Facturación mensual disponible`,
    "https://www.nyenglishteacher.com/es/faqs/",
    { type: "faq-policy", language: "es" },
  );

  console.log("\n✅ Knowledge base populated successfully!");
  console.log("📊 Total documents added: 23");

  await client.end();
}

populateKnowledgeBase().catch((error) => {
  console.error("❌ Error populating knowledge base:", error);
  process.exit(1);
});
