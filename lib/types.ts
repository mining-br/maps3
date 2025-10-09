export type RIGeoItem = {
  handle: string;
  title: string;
  year?: string;
  uf?: string;
  links: { href: string; label: string }[];
  scale: "250k" | "100k" | "50k" | "unknown";
};
