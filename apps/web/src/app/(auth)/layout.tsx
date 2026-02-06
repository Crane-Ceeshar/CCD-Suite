'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const moduleColors = [
  '#0047AB', '#8B5CF6', '#EC4899', '#9BBD2B', '#F59E0B',
  '#06B6D4', '#6366F1', '#14B8A6', '#F97316',
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative bg-ccd-blue overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/3 -left-1/4 w-[700px] h-[700px] rounded-full border border-white/[0.05]"
          />
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full border border-white/[0.05]"
          />

          {/* Floating module dots */}
          {moduleColors.map((color, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                backgroundColor: color,
                width: 6 + i * 2,
                height: 6 + i * 2,
                left: `${15 + i * 8}%`,
                top: `${25 + Math.sin(i * 0.8) * 25}%`,
                opacity: 0.3,
              }}
              animate={{
                y: [0, -20 - i * 3, 0],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: 4 + i * 0.6,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Pattern watermark */}
          <div className="absolute bottom-8 right-8 w-48 h-48 opacity-[0.04]">
            <svg viewBox="0 0 525 448.86" className="w-full h-full">
              <path fill="#fff" d="M525,0l-210.32,140.44c-9.99.44-19.05-2.32-29.3-2.4-46.8-.26-88.04,18.28-117.71,47.65L0,142.58,525,0h0Z"/>
              <polygon fill="#fff" points="525 0 219.53 448.86 235.08 253.87 525 0"/>
              <path fill="#fff" d="M274.44,177.18c-10.5,8.7-22.66,19.13-34.68,27.38h0c-.88.63-1.73,1.22-2.65,1.81-8.18,5.27-19.38,9.1-22.26-3.91-.26-1.14-.41-2.28-.48-3.35-.88-14.59,13.52-26.75,26.79-29.92,10.1-2.43,23.03-.66,31.29,5.86.52.41,1.47,1.51,1.99,2.14h0Z"/>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 xl:p-16 w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <svg viewBox="0 0 525 448.86" className="h-9 w-9 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
              <path fill="#fff7e3" d="M525,0l-210.32,140.44c-9.99.44-19.05-2.32-29.3-2.4-46.8-.26-88.04,18.28-117.71,47.65L0,142.58,525,0h0Z"/>
              <polygon fill="#fff7e3" points="525 0 219.53 448.86 235.08 253.87 525 0"/>
              <path fill="#fff7e3" d="M274.44,177.18c-10.5,8.7-22.66,19.13-34.68,27.38h0c-.88.63-1.73,1.22-2.65,1.81-8.18,5.27-19.38,9.1-22.26-3.91-.26-1.14-.41-2.28-.48-3.35-.88-14.59,13.52-26.75,26.79-29.92,10.1-2.43,23.03-.66,31.29,5.86.52.41,1.47,1.51,1.99,2.14h0Z"/>
            </svg>
            <span className="text-xl font-bold font-heading text-white/90">CCD Suite</span>
          </Link>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl xl:text-5xl font-bold font-heading text-white leading-tight"
            >
              Everything your
              <br />agency needs,
              <br /><span className="text-ccd-lime">in one suite.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-white/50 text-lg max-w-md leading-relaxed"
            >
              9 integrated modules. AI-powered automation. Built for modern digital agencies.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex gap-1.5 origin-left"
            >
              {moduleColors.map((color, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.05, duration: 0.3 }}
                  className="w-6 h-1.5 rounded-full"
                  style={{ backgroundColor: color, opacity: 0.7 }}
                />
              ))}
            </motion.div>
          </div>

          <p className="text-white/30 text-sm">
            A product of{' '}
            <a href="https://craneceeshar.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white/70 transition-colors underline underline-offset-2">
              Crane & Ceeshar Digital
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center bg-background p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <svg viewBox="0 0 525 448.86" className="h-8 w-8" aria-hidden="true">
                <path fill="#194ca1" d="M525,0l-210.32,140.44c-9.99.44-19.05-2.32-29.3-2.4-46.8-.26-88.04,18.28-117.71,47.65L0,142.58,525,0h0Z"/>
                <polygon fill="#194ca1" points="525 0 219.53 448.86 235.08 253.87 525 0"/>
                <path fill="#194ca1" d="M274.44,177.18c-10.5,8.7-22.66,19.13-34.68,27.38h0c-.88.63-1.73,1.22-2.65,1.81-8.18,5.27-19.38,9.1-22.26-3.91-.26-1.14-.41-2.28-.48-3.35-.88-14.59,13.52-26.75,26.79-29.92,10.1-2.43,23.03-.66,31.29,5.86.52.41,1.47,1.51,1.99,2.14h0Z"/>
              </svg>
              <span className="text-xl font-bold font-heading text-ccd-blue">CCD Suite</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">Crane & Ceeshar Digital</p>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
