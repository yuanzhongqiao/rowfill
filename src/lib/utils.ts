import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function stripCodeBlockBackTicks(text: string) {
  // Regular expression to match Markdown code blocks
  const codeBlockRegex = /```[a-zA-Z]*\n([\s\S]*?)\n```/g;
  // Replace the matched code blocks with their content
  return text.replace(codeBlockRegex, (_, code) => code.trim());
}
