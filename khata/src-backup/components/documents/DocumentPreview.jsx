export const DocumentPreview = ({ html, extra }) => (
  <>
    <div className="overflow-x-auto pe-6" dangerouslySetInnerHTML={{ __html: html }} />
    <div className="mt-5 flex flex-wrap items-center gap-2">{extra}</div>
  </>
);
