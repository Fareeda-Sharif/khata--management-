import { toHtml } from "../../services/documents/html";
import { DocButtons } from "./DocButtons";
import { DocumentPreview } from "./DocumentPreview";

// Preview of any document model with the Download PDF / Print / Save as PDF buttons
export const DocModal = ({ doc, filename, extra }) => (
  <DocumentPreview html={toHtml(doc)} extra={<><DocButtons build={() => doc} filename={filename} />{extra}</>} />
);
