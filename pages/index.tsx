import FeedbackForm from "../feedback-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md mx-auto">
        <FeedbackForm />
      </div>
    </main>
  )
}
