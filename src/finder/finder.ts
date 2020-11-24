export interface UmlContent {
  $node: HTMLElement;
  pumltext: string;
}

export interface Finder {
  canFind(webPageUrl: string): boolean;
  find(webPageUrl: string, $root: HTMLElement): Promise<UmlContent[]>;
}
