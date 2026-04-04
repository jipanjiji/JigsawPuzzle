// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  srcDir: 'app/',
  devtools: { enabled: false },
  
  app: {
    head: {
      title: 'Jigsaw Puzzle Speed Race - Multiplayer 🧩',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Uji kecepatan kamu dalam menyusun puzzle jigsaw secara real-time melawan teman! Siapa yang tercepat?' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#6366f1' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap' }
      ]
    }
  },

  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/tailwind.css'],
})
