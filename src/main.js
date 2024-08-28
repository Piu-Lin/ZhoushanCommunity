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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxMjVlNTBlMy02NTI3LTQzYjktYmE4Yy04YTk3ZmY3M2RmZWUiLCJpZCI6MjI4MzY4LCJpYXQiOjE3MjQ4MzA5NTh9.nRDUt5Xp2BNYS4qhaGqI12E5qWiAAMXIx6tpOI-jXYw";

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

// 高亮元素
const highlighted = {
  feature: undefined,
  originalColor: new Cesium.Color(),
};

viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(event) {
  // 清除之前的高亮元素
  if (Cesium.defined(highlighted.feature)) {
    highlighted.feature.color = highlighted.originalColor;
    highlighted.feature = undefined;
  }
  // 选择新要素
  const pickedFeature = viewer.scene.pick(event.position);
  if (!Cesium.defined(pickedFeature)) {
    return;
  }
  // 存储选中要素的信息
  highlighted.feature = pickedFeature;
  Cesium.Color.clone(pickedFeature.color, highlighted.originalColor);
  // 高亮选中元素
  pickedFeature.color = Cesium.Color.RED;
  // 获取鼠标点击位置对应的地理坐标
  const cartesian = viewer.scene.camera.pickEllipsoid(
    event.position,
    viewer.scene.globe.ellipsoid
  );

  if (cartesian) {
    // 转换为地理坐标（经度、纬度、高度）
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const height = cartographic.height;

    // 创建包含鼠标位置的消息对象
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

    // 向父窗口发送消息
    console.log("将向父类发送：", JSON.stringify(message));
    window.parent.postMessage(JSON.stringify(message), "*");
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
        createPop(payload);
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

/**
 * 批量创建气泡效果在Cesium中，并允许配置每个气泡的图标、大小和偏移。
 *
 * @param {Array} dataArray - 包含多个位置信息的对象数组。
 * @returns {void}
 */
function createPop(dataArray) {
  dataArray.forEach((data) => {
    // 验证数据有效性
    if (!data || !data.item || !data.item.matrixPoint) {
      console.error("Invalid data format for entry:", data);
      return;
    }

    // 提取位置信息
    const location = JSON.parse(data.item.matrixPoint);

    // 可选地从数据中提取图标URL，如果没有提供则使用默认图标
    const image = data.item.icon || "images/markers/marker2.png";

    // 可选地从数据中提取宽度和高度，如果没有提供则使用默认值
    const width = data.popSize || 20;
    const height = data.popSize || 20;

    // 可选地从数据中提取Z轴偏移量，如果没有提供则使用默认值
    const eyeOffsetZ = data.eyeOffsetZ || -100;

    // 转换经纬度坐标为Cesium的笛卡尔坐标
    const position = Cesium.Cartesian3.fromDegrees(
      location.x,
      location.y,
      location.z
    );

    // 创建Entity和Billboard
    const entity = new Cesium.Entity({
      position: position,
      billboard: {
        image: image,
        width: width,
        height: height,
        eyeOffset: new Cesium.Cartesian3(0.0, 0.0, eyeOffsetZ),
        pixelOffset: new Cesium.Cartesian2(0, 0),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        scale: 1.0,
      },
    });

    // 将Entity添加到viewer中
    viewer.entities.add(entity);
  });
}

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
        heading: Cesium.Math.toRadians((angle * 180) / Math.PI),
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
  const height = Cesium.Math.clamp(
    currentPositionCartographic.height,
    minDistance,
    maxDistance
  );
  const newPosition = Cesium.Cartesian3.fromDegrees(
    Cesium.Math.toDegrees(currentPositionCartographic.longitude),
    Cesium.Math.toDegrees(currentPositionCartographic.latitude),
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
