import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
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

viewer._cesiumWidget._creditContainer.style.display = "none";

Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjMGRmMDMwMS1kNWExLTQ0ODgtYTFiYi0zMDJkZjMxMjUxNGQiLCJpZCI6MjI4MzY4LCJpYXQiOjE3MjEwMDgwODR9.8MaR-sOFXpZ3G3i21O_3J4XpogxbQgOpnqg7uznsrPU";

viewer.scene.globe.depthTestAgainstTerrain = true;

const tilesetUrl = "tiles/tileset.json";

const tilesetOptions = {
  url: tilesetUrl,
  maximumScreenSpaceError: 1024,
  skipLevelOfDetail: true,
  baseScreenSpaceError: 1024,
  skipScreenSpaceErrorFactor: 16,
  skipLevels: 1,
  immediatelyLoadDesiredLevelOfDetail: false,
  loadSiblings: false,
  cullWithChildrenBounds: true,
};

let highlighted = {
  feature: undefined,
  originalColor: new Cesium.Color(),
};

viewer.screenSpaceEventHandler.setInputAction(function (event) {
  const pickedFeature = viewer.scene.pick(event.position);

  if (highlighted.feature) {
    highlighted.feature.setColor(highlighted.originalColor);
    highlighted.feature = undefined;
  }

  if (Cesium.defined(pickedFeature) && pickedFeature.content) {
    highlighted.feature = pickedFeature;
    highlighted.originalColor = pickedFeature.getColor().clone();
    pickedFeature.setColor(Cesium.Color.YELLOW.withAlpha(0.5));

    const cartesian = viewer.scene.camera.pickEllipsoid(
      event.position,
      viewer.scene.globe.ellipsoid
    );

    if (cartesian) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const longitude = Math.toDegrees(cartographic.longitude);
      const latitude = Math.toDegrees(cartographic.latitude);
      const height = cartographic.height;

      const MouseLocation = {
        x: longitude,
        y: latitude,
        z: height,
      };

      const message = {
        type: "meshClick",
        payload: {
          MouseLocation: MouseLocation,
          source: "cesiumMap",
        },
      };

      console.log("将向父类发送：", JSON.stringify(message));
      window.parent.postMessage(JSON.stringify(message), "*");
    }
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
// 加载3d数据
Cesium.Cesium3DTileset.fromUrl(tilesetUrl, tilesetOptions)
  .then((tileset) => {
    viewer.scene.primitives.add(tileset);

    const boundingSphere = tileset.boundingSphere;
    const cartographic = Cesium.Cartographic.fromCartesian(
      boundingSphere.center
    );
    const surfaceHeight = viewer.scene.globe.getHeight(cartographic);
    const heightOffset = 75.0; // 偏移高度，根据需要调整
    const position = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      surfaceHeight + heightOffset || heightOffset
    );
    const translation = Cesium.Cartesian3.subtract(
      position,
      boundingSphere.center,
      new Cesium.Cartesian3()
    );
    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

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

  // 获取相机的方向向量
  const direction = camera.direction;
  const up = camera.up;

  // 使用 direction 和 up 计算 Heading, Pitch, Roll
  const heading = window.Math.atan2(direction.y, direction.x);
  const pitch = window.Math.asin(direction.z);
  const roll = window.Math.atan2(up.z, up.y);

  // 获取相机的位置
  const location = {
    x: position.x,
    y: position.y,
    z: position.z,
  };

  // 将旋转角度转换为度数并存储
  const rotation = {
    X: Cesium.Math.toDegrees(heading), // 绕Z轴的旋转 (Heading)
    Y: Cesium.Math.toDegrees(pitch), // 绕X轴的旋转 (Pitch)
    Z: Cesium.Math.toDegrees(roll), // 绕Y轴的旋转 (Roll)
  };

  // 创建要发送的消息
  const message = {
    type: "info",
    payload: {
      location: location,
      source: "cesiumMap",
      rotation: rotation,
    },
  };

  // 将消息发送给父类
  console.log("将向父类发送：", JSON.stringify(message));
  window.parent.postMessage(JSON.stringify(message), "*");
}

function handleFlyTo(data) {
  const location = data.location;
  const rotation = data.rotation;
  const time = data.time;

  const targetPosition = new Cesium.Cartesian3(
    location.x,
    location.y,
    location.z
  );

  const targetHeading = Cesium.Math.toRadians(rotation.X); // 绕 Z 轴旋转 (heading)
  const targetPitch = Cesium.Math.toRadians(rotation.Y); // 绕 X 轴旋转 (pitch)
  const targetRoll = Cesium.Math.toRadians(rotation.Z); // 绕 Y 轴旋转 (roll)

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

let centerPoint;
let rotationSpeed;
let rotationInterval;
function startRotation(data) {
  const point = data.point;
  const speed = data.speed;
  centerPoint = new Cesium.Cartesian3(point.x, point.y, point.z);
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
    const radius = Cesium.Cartesian3.distance(camera.positionWC, centerPoint);
    const x = centerPoint.x + radius * Math.cos(angle);
    const y = centerPoint.y + radius * Math.sin(angle);
    camera.setView({
      destination: new Cesium.Cartesian3(x, y, camera.positionWC.z),
      orientation: {
        up: Cesium.Cartesian3.UNIT_Z,
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
    Cesium.Cartographic.fromCartesian(currentPosition);
  const height = Math.clamp(
    currentPositionCartographic.height,
    minDistance,
    maxDistance
  );
  const newPosition = Cesium.Cartesian3.fromDegrees(
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
setTimeout(() => {
  sendCameraInfo();
}, 6000);
