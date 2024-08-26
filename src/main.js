import {
  Cartesian3,
  Cartographic,
  Cesium3DTileset,
  Ion,
  Matrix4,
  Terrain,
  Viewer,
  Math,
  ScreenSpaceEventType
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
var camera = viewer.camera;

// 相机旋转所用变量以下
var rotationInterval;
var centerPoint;
var rotationSpeed;
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
  var cartesian = viewer.scene.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);

  if (cartesian) {
      // 将Cartesian坐标转换为地理坐标（经纬度）
      var cartographic = Cartographic.fromCartesian(cartesian);

      // 获取经度、纬度和高度
      var longitude = Math.toDegrees(cartographic.longitude);
      var latitude = Math.toDegrees(cartographic.latitude);
      var height = cartographic.height;

      // 构建位置对象
      var MouseLocation = {
          x: longitude,
          y: latitude,
          Z: height
      };

      // 构建消息对象
      var message = {
          action: 'MeshClick',
          MouseLocation: MouseLocation,
          source: 'cesiumMap',
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
      surfaceHeight + heightOffset || heightOffset,
    );
    const translation = Cartesian3.subtract(
      position,
      boundingSphere.center,
      new Cartesian3(),
    );
    tileset.modelMatrix = Matrix4.fromTranslation(translation);

    viewer.zoomTo(tileset);
  })
  .then(()=>{
    console.log('数据加载完成')
    window.parent.postMessage({ type: "engineFinished" },"*");
    sendCameraInfo()

  })
  .catch((error) => {
    console.error("加载3D Tiles数据集时发生错误：", error);
  });

  // 接收消息分化
  window.addEventListener('message', function(event) {
    const message = event.data;
    const origin = event.origin;
    if (event.source !== window.parent || message.includes("cesiumMap")){
      return
    }
    console.log("侦测到父页面消息")
    try {
        const data = message;
        console.log('解析父页面消息为:', data);
        switch (data.action) {
            case 'info':
                console.log('侦测到获取相机位置需求');
              sendCameraInfo()
              break;
            case 'flyTo':
              console.log('侦测到设置相机位置需求');
              handleFlyTo(data);

              break;
            case 'startRoate':
              console.log('侦测到开始旋转需求');
              startRotation(data);
              break;
            case 'flyTow':
              console.log('侦测到停止旋转需求');
              stopRotation();
              break;
            case 'setLookDistance':
              console.log('侦测到设置可视高度需求');
              setLookDistance(data);
              break;
            case 'lookAt':
              console.log('侦测到飞向对象需求');
              console.log("错误,项目中未指定ID")
              break;
            case 'marker.createpopbyid':
              console.log('侦测到根据ID创建气泡需求');
              console.log("错误,项目中未指定ID")
              break;
            case 'marker.createpop':
              console.log('侦测到根据GSI坐标创建气泡需求');
              console.log("未完成")
              break;
            case 'marker.clearByType':
              console.log('侦测到删除指定类型气泡需求');
              console.log("未完成")
              break;
            case 'marker.clearAll':
              console.log('侦测到清空所有气泡气泡需求');
              console.log("未完成")
              break;
            case 'marker.addModelTerrainZ':
              console.log('侦测到根据ID添加通用事件告警动效需求');
              console.log("错误,项目中未指定ID")
              break;
            case 'marker.clearEffectByType':
              console.log('侦测到删除指定类型通用事件告警动效需求');
              console.log("未完成")
              break;
            case 'marker.clearAllEffect':
              console.log('侦测到清空所有通用事件告警动效需求');
              console.log("未完成")
              break;
            case 'SetRes':
              console.log('侦测到设置分辨率需求');
              console.log("未完成")
              break;
            case 'CleanScene':
              console.log('侦测到清空场景需求');
              console.log("未完成")
              break;
            default:
                console.log('未知指令:', data);
        }
    } catch (error) {
        console.error('Failed to parse JSON:', error);
    }
});

function sendCameraInfo() {
  var position = camera.positionWC;
  var direction = camera.directionWC;
  var up = camera.upWC;
  var location = {
      x: position.x,
      y: position.y,
      z: position.z
  };
  var rotation = {
      X: direction.x,
      Y: direction.y,
      Z: direction.z
  };
  var message = {
      action: 'info',
      location: location,
      source: 'cesiumMap',
      rotation: rotation
  };
  console.log("将向父类发送：",JSON.stringify(message))
  window.parent.postMessage(JSON.stringify(message),"*"); 
}
function handleFlyTo(data){
  var location = data.location;
  var rotation = data.rotation;
  var time = data.time;
  var targetPosition = new Cesium.Cartesian3(location.x, location.y, location.z);
  var targetHeading = Cesium.Math.toRadians(rotation.Y); // Rotation around Y axis
  var targetPitch = Cesium.Math.toRadians(rotation.X);   // Rotation around X axis
  var targetRoll = Cesium.Math.toRadians(rotation.Z);    // Rotation around Z axis
  camera.flyTo({
      destination: targetPosition,
      duration: time,
      orientation: {
          heading: targetHeading,
          pitch: targetPitch,
          roll: targetRoll
      }
  });
}

function startRotation(data) {
  var point = data.Point;
  var speed = data.Speed;
  centerPoint = new Cesium.Cartesian3(point.x, point.y, point.z);
  rotationSpeed = speed;

  if (rotationInterval) {
      clearInterval(rotationInterval);
  }
  var angle = 0;
  rotationInterval = setInterval(function() {
      angle += rotationSpeed * 0.01; 
      if (angle >= 2 * Math.PI) {
          angle -= 2 * Math.PI; 
      }
      var radius = Cesium.Cartesian3.distance(camera.positionWC, centerPoint);
      var x = centerPoint.x + radius * Math.cos(angle);
      var y = centerPoint.y + radius * Math.sin(angle);
      camera.setView({
          destination: new Cesium.Cartesian3(x, y, camera.positionWC.z),
          orientation: {
              up: Cesium.Cartesian3.UNIT_Z,
              heading: Cesium.Math.toRadians(angle * 180 / Math.PI),
              pitch: camera.pitch,
              roll: camera.roll
          }
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
  var minDistance = data.Min;
  var maxDistance = data.Max;
  var currentPosition = camera.positionWC;
  var currentPositionCartographic = Cesium.Cartographic.fromCartesian(currentPosition);
  var height = Cesium.Math.clamp(currentPositionCartographic.height, minDistance, maxDistance);
  var newPosition = Cesium.Cartesian3.fromDegrees(
      Cesium.Math.toDegrees(currentPositionCartographic.longitude),
      Cesium.Math.toDegrees(currentPositionCartographic.latitude),
      height
  );
  camera.setView({
      destination: newPosition,
      orientation: {
          heading: camera.heading,
          pitch: camera.pitch,
          roll: camera.roll
      }
  });
}