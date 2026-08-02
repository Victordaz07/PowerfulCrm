import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateRecurringInvoices, remindOverdueInvoices, remindUpcomingEvents } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateRecurringInvoices, remindOverdueInvoices, remindUpcomingEvents],
});
