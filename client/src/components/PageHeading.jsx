export default function PageHeading({ index, eyebrow, title, description }) {
  return (
    <header className="page-heading">
      <p className="eyebrow"><span className="section-index">{index}</span>{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p className="page-description">{description}</p>}
    </header>
  );
}
