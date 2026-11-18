import vue from '@vitejs/plugin-vue'
import {vertex} from '@type32/vertex-plugin/vite'
import {defineConfig} from 'vite'

export default defineConfig({plugins: [vue(), vertex({pack: true})]})
