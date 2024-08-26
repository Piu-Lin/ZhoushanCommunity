import {
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  Ion,
  Matrix4,
  Terrain,
  Viewer,
  Math,
  ScreenSpaceEventType,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import { sendMsg } from "./utils";

const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(),
  animation: false, //动画小部件
  baseLayerPicker: false, //地图图层组件
  fullscreenButton: false, //全屏组件
  geocoder: false, //地理编码搜索组件
  homeButton: false, //首页组件
  infoBox: false, //信息框
  sceneModePicker: false, //场景模式
  selectionIndicator: false, //选取指示器组件
  timeline: false, //时间轴
  navigationHelpButton: false, //帮助按钮
  navigationInstructionsInitiallyVisible: false,
});
const camera = viewer.camera;

// 相机旋转所用变量以下
let rotationInterval;
let centerPoint;
let rotationSpeed;
// 相机旋转所用变量以上

viewer._cesiumWidget._creditContainer.style.display = "none";

Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMGRmMDMwMS1kNWExLTQ0ODgtYTFiYi0zMDJkZjMxMjUxNGQiLCJpZCI6MjI4MzY4LCJpYXQiOjE3MjEwMDgwODR9.8MaR-sOFXpZ3G3i21O_3J4XpogxbQgOpnqg7uznsrPU";

viewer.scene.globe.depthTestAgainstTerrain = true;

const tilesetUrl = "tiles/tileset.json";

const tilesetOptions = {
  url: tilesetUrl,
  maximumScreenSpaceError: 1024, // 可以根据需要调整
  skipLevelOfDetail: true,
  baseScreenSpaceError: 1024,
  skipScreenSpaceErrorFactor: 16,
  skipLevels: 1,
  immediatelyLoadDesiredLevelOfDetail: false,
  loadSiblings: false,
  cullWithChildrenBounds: true,
};
viewer.screenSpaceEventHandler.setInputAction(function (event) {
  // 使用Cesium的地形或模型拾取工具获取点击位置的地理坐标
  const cartesian = viewer.scene.camera.pickEllipsoid(
    event.position,
    viewer.scene.globe.ellipsoid
  );

  if (cartesian) {
    // 将Cartesian坐标转换为地理坐标（经纬度）
    const cartographic = Cartographic.fromCartesian(cartesian);

    // 获取经度、纬度和高度
    const longitude = Math.toDegrees(cartographic.longitude);
    const latitude = Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;

    // 构建位置对象
    const MouseLocation = {
      x: longitude,
      y: latitude,
      z: height,
    };

    // 构建消息对象
    const message = {
      type: "MeshClick",
      payload: {
        MouseLocation: MouseLocation,
        source: "cesiumMap",
      },
    };

    // 输出到控制台
    console.log("将向父类发送：", JSON.stringify(message));

    // 使用postMessage将数据发送给父窗口
    window.parent.postMessage(JSON.stringify(message), "*");
  }
}, ScreenSpaceEventType.LEFT_CLICK);
// 加载3d数据
Cesium3DTileset.fromUrl(tilesetUrl, tilesetOptions)
  .then((tileset) => {
    viewer.scene.primitives.add(tileset);

    const boundingSphere = tileset.boundingSphere;
    const cartographic = Cartographic.fromCartesian(boundingSphere.center);
    const surfaceHeight = viewer.scene.globe.getHeight(cartographic);
    const heightOffset = 75.0; // 偏移高度，根据需要调整
    const position = Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      surfaceHeight + heightOffset || heightOffset
    );
    const translation = Cartesian3.subtract(
      position,
      boundingSphere.center,
      new Cartesian3()
    );
    tileset.modelMatrix = Matrix4.fromTranslation(translation);

    viewer.zoomTo(tileset);
  })
  .then(() => {
    console.log("数据加载完成");
    window.parent.postMessage({ type: "engineFinished" }, "*");
    sendCameraInfo();
  })
  .catch((error) => {
    console.error("加载3D Tiles数据集时发生错误：", error);
  });

// 接收消息分化
window.addEventListener("message", function (event) {
  const message = event.data;
  const origin = event.origin;
  console.log("侦测到父页面消息");
  try {
    if (
      event.source !== window.parent ||
      JSON.stringify(message).includes("cesiumMap")
    ) {
      return;
    }
    const data = message;
    const payload = data.payload;
    console.log("解析父页面消息为:", data);
    switch (data.type) {
      case "info":
        console.log("侦测到获取相机位置需求");
        sendCameraInfo();
        break;
      case "flyTo":
        console.log("侦测到设置相机位置需求");
        handleFlyTo(payload);

        break;
      case "startRoate":
        console.log("侦测到开始旋转需求");
        startRotation(payload);
        break;
      case "flyTow":
        console.log("侦测到停止旋转需求");
        stopRotation();
        break;
      case "setLookDistance":
        console.log("侦测到设置可视高度需求");
        setLookDistance(payload);
        break;
      case "lookAt":
        console.log("侦测到飞向对象需求");
        console.log("错误,项目中未指定ID");
        break;
      case "marker.createpopbyid":
        console.log("侦测到根据ID创建气泡需求");
        console.log("错误,项目中未指定ID");
        break;
      case "marker.createpop":
        console.log("侦测到根据GSI坐标创建气泡需求");
        console.log("未完成");
        break;
      case "marker.clearByType":
        console.log("侦测到删除指定类型气泡需求");
        console.log("未完成");
        break;
      case "marker.clearAll":
        console.log("侦测到清空所有气泡气泡需求");
        console.log("未完成");
        break;
      case "marker.addModelTerrainZ":
        console.log("侦测到根据ID添加通用事件告警动效需求");
        console.log("错误,项目中未指定ID");
        break;
      case "marker.clearEffectByType":
        console.log("侦测到删除指定类型通用事件告警动效需求");
        console.log("未完成");
        break;
      case "marker.clearAllEffect":
        console.log("侦测到清空所有通用事件告警动效需求");
        console.log("未完成");
        break;
      case "SetRes":
        console.log("侦测到设置分辨率需求");
        console.log("未完成");
        break;
      case "CleanScene":
        console.log("侦测到清空场景需求");
        console.log("未完成");
        break;
      default:
        console.log("未知指令:", data);
    }
  } catch (error) {
    console.error("Failed to parse JSON:", error);
  }
});

function sendCameraInfo() {
  const position = camera.positionWC;
  const direction = camera.directionWC;
  const up = camera.upWC;
  const location = {
    x: position.x,
    y: position.y,
    z: position.z,
  };
  const rotation = {
    X: direction.x,
    Y: direction.y,
    Z: direction.z,
  };
  const message = {
    type: "info",
    payload: {
      location: location,
      source: "cesiumMap",
      rotation: rotation,
    },
  };
  console.log("将向父类发送：", JSON.stringify(message));
  window.parent.postMessage(JSON.stringify(message), "*");
}
function handleFlyTo(data) {
  const location = data.location;
  const rotation = data.rotation;
  const time = data.time;
  const targetPosition = new Cartesian3(location.x, location.y, location.z);
  const targetHeading = Math.toRadians(rotation.Y); // Rotation around Y axis
  const targetPitch = Math.toRadians(rotation.X); // Rotation around X axis
  const targetRoll = Math.toRadians(rotation.Z); // Rotation around Z axis
  camera.flyTo({
    destination: targetPosition,
    duration: time,
    orientation: {
      heading: targetHeading,
      pitch: targetPitch,
      roll: targetRoll,
    },
  });
}

function startRotation(data) {
  const point = data.point;
  const speed = data.speed;
  centerPoint = new Cartesian3(point.x, point.y, point.z);
  rotationSpeed = speed;

  if (rotationInterval) {
    clearInterval(rotationInterval);
  }
  let angle = 0;
  rotationInterval = setInterval(function () {
    angle += rotationSpeed * 0.01;
    if (angle >= 2 * Math.PI) {
      angle -= 2 * Math.PI;
    }
    const radius = Cartesian3.distance(camera.positionWC, centerPoint);
    const x = centerPoint.x + radius * Math.cos(angle);
    const y = centerPoint.y + radius * Math.sin(angle);
    camera.setView({
      destination: new Cartesian3(x, y, camera.positionWC.z),
      orientation: {
        up: Cartesian3.UNIT_Z,
        heading: Math.toRadians((angle * 180) / Math.PI),
        pitch: camera.pitch,
        roll: camera.roll,
      },
    });
  }, 16);
}

function stopRotation() {
  if (rotationInterval) {
    clearInterval(rotationInterval);
    rotationInterval = null;
  }
}
function setLookDistance(data) {
  const minDistance = data.min;
  const maxDistance = data.max;
  const currentPosition = camera.positionWC;
  const currentPositionCartographic =
    Cartographic.fromCartesian(currentPosition);
  const height = Math.clamp(
    currentPositionCartographic.height,
    minDistance,
    maxDistance
  );
  const newPosition = Cartesian3.fromDegrees(
    Math.toDegrees(currentPositionCartographic.longitude),
    Math.toDegrees(currentPositionCartographic.latitude),
    height
  );
  camera.setView({
    destination: newPosition,
    orientation: {
      heading: camera.heading,
      pitch: camera.pitch,
      roll: camera.roll,
    },
  });
}
