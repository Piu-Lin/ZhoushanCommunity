import {defineConfig} from "vite";
import {viteStaticCopy} from "vite-plugin-static-copy";

const cesiumSource = "node_modules/cesium/Build/Cesium";
// This is the base url for static files that CesiumJS needs to load.
// Set to an empty string to place the files at the site's root path
// const cesiumBaseUrl = "binhai/shaoxingyjhsq/cesiumStatic";
// const cesiumBaseUrl = "binhai/shaoxingjfsq/cesiumStatic";
// const cesiumBaseUrl = "binhai/shaoxingsjjsq/cesiumStatic";
// const cesiumBaseUrl = "changxingxxsq/cesiumStatic";
// const cesiumBaseUrl = "changxingyxksq/cesiumStatic";
// const cesiumBaseUrl = "changxingsmhdsq/cesiumStatic";
// const cesiumBaseUrl = "changxingsysq/cesiumStatic";
// const cesiumBaseUrl = "changxingxysq/cesiumStatic";
// const cesiumBaseUrl = "changxinglssq/cesiumStatic";
const cesiumBaseUrl = "cesiumStatic";
// https://vitejs.dev/config/
export default defineConfig({
    define: {
        // Define relative base path in cesium for loading assets
        // https://vitejs.dev/config/shared-options.html#define
        CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}`),
    },
    plugins: [
        // Copy Cesium Assets, Widgets, and Workers to a static directory.
        // If you need to add your own static files to your project, use the `public` directory
        // and other options listed here: https://vitejs.dev/guide/assets.html#the-public-directory
        viteStaticCopy({
            targets: [
                {src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl},
                {src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl},
                {src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl},
                {src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl},
            ],
        }),
    ],
    // base: '/changxinglssq/' // 设置基础路径
    // base: '/changxingxysq/' // 设置基础路径
    // base: '/changxingsysq/' // 设置基础路径
    // base: '/changxingsmhdsq/' // 设置基础路径
    // base: '/changxingyxksq/' // 设置基础路径
    // base: '/changxingxxsq/' // 设置基础路径
    // base: '/binhai/shaoxingsjjsq/' // 设置基础路径
    // base: '/binhai/shaoxingjfsq/' // 设置基础路径
    // base: '/binhai/shaoxingyjhsq/' // 设置基础路径
});
