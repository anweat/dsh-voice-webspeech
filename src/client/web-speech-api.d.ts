/** Global Web Speech API types (browser-only ambient). */

declare global {
  interface WebkitSpeechRecognitionConstructor {
    new (): WebkitSpeechRecognition
    prototype: WebkitSpeechRecognition
  }

  interface WebkitSpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    onstart: ((this: WebkitSpeechRecognition, ev: Event) => void) | null
    onresult: ((this: WebkitSpeechRecognition, ev: WebkitSpeechRecognitionEvent) => void) | null
    onerror: ((this: WebkitSpeechRecognition, ev: WebkitSpeechRecognitionErrorEvent) => void) | null
    onend: ((this: WebkitSpeechRecognition, ev: Event) => void) | null
    start(): void
    stop(): void
    abort(): void
  }

  interface WebkitSpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
  }

  interface WebkitSpeechRecognitionErrorEvent extends Event {
    readonly error: string
    readonly message: string
  }

  interface Window {
    webkitSpeechRecognition: WebkitSpeechRecognitionConstructor | undefined
    SpeechRecognition: WebkitSpeechRecognitionConstructor | undefined
  }
}

export {}