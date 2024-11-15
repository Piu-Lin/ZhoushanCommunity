import * as Cesium from "cesium";

// export function loadTiles(viewer, tilesetUrl) {
//   const tilesetOptions = {
//     url: tilesetUrl,
//     maximumScreenSpaceError: 1024,
//     maximumMemoryUsage: 10240, // 设置更高的内存限制（如 20GB）
//     dynamicScreenSpaceError: false,
//     skipLevelOfDetail: true,
//     baseScreenSpaceError: 1024,
//     skipScreenSpaceErrorFactor: 1024,
//     skipLevels: 1,
//   };
//   Cesium.Cesium3DTileset.fromUrl(tilesetUrl, tilesetOptions)
//     .then((tileset) => {
//       viewer.scene.primitives.add(tileset);
//       const boundingSphere = tileset.boundingSphere;
//       const cartographic = Cesium.Cartographic.fromCartesian(
//         boundingSphere.center
//       );
//       const surfaceHeight = viewer.scene.globe.getHeight(cartographic);
//       const heightOffset = 75.0; // 偏移高度，根据需要调整
//       const position = Cesium.Cartesian3.fromRadians(
//         cartographic.longitude,
//         cartographic.latitude,
//         surfaceHeight + heightOffset || heightOffset
//       );
//       const translation = Cesium.Cartesian3.subtract(
//         position,
//         boundingSphere.center,
//         new Cesium.Cartesian3()
//       );
//       tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
//
//       viewer.zoomTo(tileset);
//     })
//     .then(() => {
//       console.log("数据加载完成2");
//       window.parent.postMessage({type: "engineFinished"}, "*");
//       // sendCameraInfo();
//     })
//     .catch((error) => {
//       console.error("加载3D Tiles数据集时发生错误：", error);
//     });
// }

// const tilesetOptions = {
//   url: tilesetUrl,
//   maximumScreenSpaceError: 1024, // 保持较低的屏幕空间误差，提高精度
//   maximumMemoryUsage: 10240, // 设置更高的内存限制（如 20GB）
//   dynamicScreenSpaceError: false, // 动态调整屏幕空间误差
//   skipLevelOfDetail: true, // 跳过 LOD 计算，保持模型加载
//   baseScreenSpaceError: 1024, // 更高的基础误差，减少内存占用
//   skipScreenSpaceErrorFactor: 1024, // 提高误差因子，减少计算负担
//   skipLevels: 1, // 跳过一定的 LOD 层级
// };
//
//
// const tilesetOptions21 = {
//   url: tilesetUrl21,
//   maximumScreenSpaceError: 1024,
//   maximumMemoryUsage: 10240, // 设置更高的内存限制（如 20GB）
//   dynamicScreenSpaceError: false,
//   skipLevelOfDetail: true,
//   baseScreenSpaceError: 1024,
//   skipScreenSpaceErrorFactor: 1024,
//   skipLevels: 1,
// };

export function loadTiles(viewer, tilesetUrl) {
  let heightOffset = 85.0;
  // 配置参数
  if (tilesetUrl === "/tiles2/tiles2/tileset.json") {
    heightOffset = 37.0; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles2/tiles3/tileset.json") {
    heightOffset = 67.0; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles4/tiles2/tileset.json") {
    heightOffset = 67.0; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles6/tiles1/tileset.json") {
    heightOffset = 54.3; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles5/tiles1/tileset.json") {
    heightOffset = 65.0; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles2/tiles4/tileset.json") {
    heightOffset = 132.0; // 偏移高度，根据需要调整
  } else if (tilesetUrl === "/tiles3/tiles1/tileset.json") {
    heightOffset = 95.0; // 偏移高度，根据需要调整
  }
  const tilesetOptions = {
    url: tilesetUrl,
    maximumScreenSpaceError: 1024, // 使用更小的屏幕空间误差
    maximumMemoryUsage: 1024, // 设置更高的内存限制（例如 10GB）
    dynamicScreenSpaceError: true,
    skipLevelOfDetail: true, // 不跳过 LOD 层次
    baseScreenSpaceError: 1024,
    skipScreenSpaceErrorFactor: 1024,
    skipLevels: 5,
  };

  // 加载3D Tiles数据
  Cesium.Cesium3DTileset.fromUrl(tilesetUrl, tilesetOptions)
    .then((tileset) => {
      // 将3D Tiles添加到场景中
      viewer.scene.primitives.add(tileset);

      // 计算 boundingSphere 中心位置
      const boundingSphere = tileset.boundingSphere;
      const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
      const surfaceHeight = viewer.scene.globe.getHeight(cartographic);

      // 计算偏移后的目标位置
      const position = Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        surfaceHeight + heightOffset || heightOffset
      );

      // 计算并设置模型的变换矩阵
      const translation = Cesium.Cartesian3.subtract(position, boundingSphere.center, new Cesium.Cartesian3());
      tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

      // 确保视图聚焦到加载的 tileset
      return viewer.zoomTo(tileset);
    })
    .then(() => {
      // 输出数据加载完成的信息
      console.log("数据加载完成");
      // 通知父窗口，数据加载完成
      window.parent.postMessage({type: "engineFinished"}, "*");
    })
    .catch((error) => {
      // 错误处理
      console.error("加载3D Tiles数据集时发生错误：", error);
    });
}
