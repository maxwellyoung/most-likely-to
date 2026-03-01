declare module "*.json" {
  interface Prompt {
    text: string;
    category: string;
    chaos: number;
    type: string;
    timer?: number;
  }

  interface Category {
    name: string;
    emoji: string;
    description: string;
  }

  const content: {
    categories: Record<string, Category>;
    prompts: Prompt[];
    sexy: Prompt[];
  };
  export default content;
}
