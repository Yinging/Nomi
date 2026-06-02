export type WorkbenchAiMessage = {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
}
