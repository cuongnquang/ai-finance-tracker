import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        })
        if (error) alert(error.message)
        setLoading(false)
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: "google", 
            options: { redirectTo: `${window.location.origin}`} 
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className='w-[400px]'>
                
            </Card>
        </div>
    )
}