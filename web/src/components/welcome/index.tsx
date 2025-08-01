"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useScroll } from "framer-motion"
import { openDB } from "idb"

// Initialize the database with proper schema while preserving existing data
const initDB = async () => {
  try {
    const db = await openDB("galaxy-wallet-db", 1, {
      upgrade(db) {
        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains("encrypted-wallet")) {
          const store = db.createObjectStore("encrypted-wallet", {
            keyPath: "id",
            autoIncrement: true
          })
          // Create any indexes if needed
          store.createIndex("wallet", "wallet", { unique: false })
        }
      },
    })
    return db
  } catch (error) {
    console.error("Error initializing database:", error)
    throw error
  }
}

import { StarBackground } from "@/components/effects/star-background"
import { ShootingStarsEffect } from "@/components/effects/shooting-stars-effect"
import { Header } from "./header"
import { HeroSection } from "./hero-section"
import { FeatureSection } from "./feature-section"
import { CTASection } from "./cta-section"
import { Footer } from "./footer"
import { CreateWalletModal } from "@/components/wallet-creation/create-wallet-modal"
import { GalaxyLogin } from "@/components/login/galaxy-login"

export function WelcomeScreen() {
  const containerRef = useRef(null)
  const router = useRouter()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isCreating] = useState(false)

  const handleWalletCreated = () => {
    setIsCreateModalOpen(false)
    setIsLoginModalOpen(true)
  }

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false)
    router.push("/dashboard")
  }

  const handleGetStarted = async () => {
    try {
      const db = await initDB()
      const tx = db.transaction("encrypted-wallet", "readonly")
      const store = tx.objectStore("encrypted-wallet")
      const wallets = await store.getAll()
      
      if (wallets && wallets.length > 0) {
        setIsLoginModalOpen(true)
      } else {
        setIsCreateModalOpen(true)
      }
      
      // Close the transaction
      await tx.done
    } catch (error) {
      console.error("Error accessing wallet:", error)
      // If there's an error, assume no wallet exists and show creation screen
      setIsCreateModalOpen(true)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#0A0A1A] text-white overflow-hidden"
    >
      <StarBackground />
      <ShootingStarsEffect />

      <CreateWalletModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onWalletCreated={handleWalletCreated}
      />

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <GalaxyLogin
            onLoginSuccess={handleLoginSuccess}
            onRecoveryClick={() => {
              setIsLoginModalOpen(false)
              setIsCreateModalOpen(true)
            }}
            onClose={() => setIsLoginModalOpen(false)}
          />
        </div>
      )}

      <Header onGetStarted={handleGetStarted} isLoading={isCreating} />

      <HeroSection
        scrollYProgress={useScroll({ target: containerRef }).scrollYProgress}
      />
      <FeatureSection />
      <CTASection onGetStarted={handleGetStarted} isLoading={isCreating} />
      <Footer />
    </div>
  )
}