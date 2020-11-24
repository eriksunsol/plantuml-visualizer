import { PlantUmlEncoder } from '../encoder/plantUmlEncoder';

const attrNameForAvoidingDuplicates = 'data-puml-vis';

export function markAsAlreadyProcessed($content: HTMLElement): boolean {
  if ($content.getAttribute(attrNameForAvoidingDuplicates)) {
    return false;
  }
  $content.setAttribute(attrNameForAvoidingDuplicates, '');
  return true;
}

export async function textToEncodedImage(text: string): Promise<string> {
  const res = await fetch(PlantUmlEncoder.getImageUrl(text));
  const encoded = `data:image/svg+xml,${encodeURIComponent(await res.text())}`;
  return encoded;
}
