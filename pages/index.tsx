import Link from "next/link"
import FeedbackForm from "../feedback-form"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
     <div className="w-full max-w-md mx-auto">
        <div className="mb-4 flex justify-end gap-2">
          <Link href="/login">
            
          </Link>
          <Link href="/debug-auth">
            
          </Link>
        </div>
        <FeedbackForm />
      </div>
    </main>
  )
}
