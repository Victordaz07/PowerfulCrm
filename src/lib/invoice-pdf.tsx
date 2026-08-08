import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 700 },
  label: { color: "#666", marginBottom: 2 },
  table: { marginTop: 16, borderTopWidth: 1, borderTopColor: "#ddd" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 6 },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalsBox: { marginTop: 16, alignItems: "flex-end" },
});

type InvoiceForPdf = {
  number: string;
  clientName: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  dueDate: Date | null;
  items: { description: string; quantity: number; unitPrice: number }[];
};

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(n);
}

function InvoiceDocument({ invoice }: { invoice: InvoiceForPdf }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Factura {invoice.number}</Text>
            <Text style={styles.label}>Para: {invoice.clientName}</Text>
          </View>
          {invoice.dueDate && (
            <Text style={styles.label}>
              Vence: {invoice.dueDate.toLocaleDateString("es-MX")}
            </Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={[styles.row, { fontWeight: 700 }]}>
            <Text style={styles.colDesc}>Descripción</Text>
            <Text style={styles.colQty}>Cant.</Text>
            <Text style={styles.colPrice}>Precio</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View style={styles.row} key={i}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{fmt(item.unitPrice, invoice.currency)}</Text>
              <Text style={styles.colTotal}>
                {fmt(item.quantity * item.unitPrice, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <Text>Subtotal: {fmt(invoice.subtotal, invoice.currency)}</Text>
          <Text>Impuestos: {fmt(invoice.tax, invoice.currency)}</Text>
          <Text style={{ fontWeight: 700, marginTop: 4 }}>
            Total: {fmt(invoice.total, invoice.currency)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdf(invoice: InvoiceForPdf): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument invoice={invoice} />);
}
