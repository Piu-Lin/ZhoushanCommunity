import * as Cesium from "cesium";

const tempGlobal = {};
const FlightEntity = "FlightEntity";
const FlightListener = "FlightListener";
let flyData = {
  id: "fly",
  name: "路径",
  points: [],
  totaltime: 0,
  visible: {
    pathname: false,
    list: true,
    play: true,
    save: false
  }
};
const speed = 90;

let startTime = null;
let stopTime = null;

//向路径中添加点位
export function addPointToPath(viewer) {
  console.log(flyData, "flyData");
  let camera = viewer.camera;
  let cartographic = camera.positionCartographic;
  let x = Cesium.Math.toDegrees(cartographic.longitude);
  let y = Cesium.Math.toDegrees(cartographic.latitude);
  let z = cartographic.height > 0 ? cartographic.height : 0;
  let heading = camera.heading;
  let pitch = camera.pitch;
  let range = z;
  //计算当前视图与前一视图的距离
  let d = 0;
  if (flyData.points.length > 0) {
    let point = flyData.points[flyData.points.length - 1];
    let preCartographic = {
      longitude: Cesium.Math.toRadians(point.x),
      latitude: Cesium.Math.toRadians(point.y),
      height: point.z
    };
    d = calculateDistance(cartographic, preCartographic);
  }
  let time = (d / speed).toFixed(2);
  let pointId = guid();
  flyData.points.push({
    id: pointId,
    name: "点位",
    x: x,
    y: y,
    z: z,
    heading: heading,
    pitch: pitch,
    range: range,
    time: time,
    visible: {
      pointname: false
    }
  });
}

//播放
export function play(viewer, id) {
  let flightEntity = tempGlobal[FlightEntity];
  let flightListener = tempGlobal[FlightListener];
  if (Cesium.defined(flightEntity) && Cesium.defined(flightListener)) {
    //播放暂停
    if (flightEntity.id === id) {
      viewer.clock.shouldAnimate = true;
      flyData.visible.play = false;
    } else {
      flyData.visible.play = true;
      stop(viewer, flightEntity.id);
      play(viewer, id);
    }
  } else {
    createFlightPathPlayer(viewer, id);
    flyData.visible.play = false;
  }
}

//创建飞行路径
function createFlightPathPlayer(viewer) {
  let flightData = null;
  let totaltime = 0;
  flyData.points.forEach(function (point, j) {
    totaltime += Number(point.time);
  });
  flyData.totaltime = totaltime;
  flightData = flyData;
  if (!flightData) {
    return;
  }
  if (flightData.totaltime <= 0) {
    return;
  }
  startTime = Cesium.JulianDate.fromDate(new Date());
  stopTime = Cesium.JulianDate.addSeconds(
    startTime,
    flightData.totaltime,
    new Cesium.JulianDate()
  );

  viewer.clock.startTime = startTime.clone();
  viewer.clock.stopTime = stopTime.clone();
  viewer.clock.currentTime = startTime.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 1.0;
  viewer.clock.shouldAnimate = true;

  let entity = viewer.entities.add({
    id: flightData.id,
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: startTime,
        stop: stopTime
      })
    ]),
    position: computeFlight(flightData),
    HPR: computeHPR(flightData)
  });
  tempGlobal[FlightEntity] = entity;
  tempGlobal[FlightEntity].position.setInterpolationOptions({
    interpolationDegree: 2,
    interpolationAlgorithm: Cesium.HermitePolynomialApproximation
  });
  addSceneListener(viewer);
}

//暂停
function pause(id) {
  viewer.clock.shouldAnimate = false;
  forEachPathTodo(id, function (item, i) {
    item.visible.play = true;
  });
}

//停止
function stop(viewer, id) {
  let flightEntity = tempGlobal[FlightEntity];
  let flightListener = tempGlobal[FlightListener];
  if (Cesium.defined(flightEntity)) {
    if (flightEntity.id === id) {
      flyData.visible.play = true;
      if (Cesium.defined(flightListener)) {
        removeSceneListener(flightListener);
      }
      if (Cesium.defined(flightEntity)) {
        viewer.entities.remove(flightEntity);
        removeTempGlobal(FlightEntity);
      }
      viewer.camera.lookAtTransform(
        Cesium.Matrix4.IDENTITY
      );
    }
  }
}


//修改点位名称
function modifyPointName(pathid, pointid) {
  forEachPointTodo(pathid, pointid, function (point, i) {
    point.visible.pointname = !point.visible.pointname;
  });
}

//删除点位
function deletePoint(pathid, pointid) {
  forEachPathTodo(pathid, function (item, i) {
    for (let j = 0; j < item.points.length; j++) {
      if (item.points[j].id === pointid) {
        item.points.splice(j, 1);
      }
    }
  });
}

function flyToPoint(viewer, pathid, pointid) {
  forEachPointTodo(pointid, function (point, i) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(point.x, point.y, point.z),
      orientation: {
        heading: Number(point.heading),
        pitch: Number(point.pitch),
        roll: 0.0
      }
    });
  });
}

//配置场景监听器
function setSceneListener(viewer) {
  let listener = null;
  let flightEntity = tempGlobal[FlightEntity];
  if (Cesium.defined(flightEntity)) {
    listener = (scene, time) => {
      let timeDif = time.secondsOfDay - startTime.secondsOfDay;
      let position = flightEntity.position.getValue(time);
      let hpr = flightEntity.HPR.getValue(timeDif);
      if (!Cesium.defined(position)) {
        return;
      }
      let hpRange = new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(hpr.h),
        Cesium.Math.toRadians(hpr.p),
        Cesium.Math.toRadians(hpr.r)
      );
      console.log(position, "position");
      console.log(hpRange, "hpRange");
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
      viewer.camera.lookAt(position, hpRange);
    };
  }
  return listener;
}

//添加场景监听器
function addSceneListener(viewer) {
  let listener = setSceneListener(viewer);
  tempGlobal[FlightListener] = listener;
  viewer.scene.postUpdate.addEventListener(listener);
}

//计算路线
function computeFlight(flightData) {
  let property = new Cesium.SampledPositionProperty();
  let currentTime = startTime.clone();
  flightData.points.forEach((p, i) => {
    let position = Cesium.Cartesian3.fromDegrees(p.x, p.y, p.z);
    currentTime = Cesium.JulianDate.addSeconds(
      currentTime,
      Number(p.time),
      new Cesium.JulianDate()
    );
    property.addSample(currentTime.clone(), position);
  });
  return property;
}

//返回hpr值和时间
function computeHPR(flightData) {
  let hpr = [];
  let timeCount = 0;
  flightData["\x70\x6f\x69\x6e\x74\x73"]["\x66\x6f\x72\x45\x61\x63\x68"](
    (point, i) => {
      timeCount += window["\x4e\x75\x6d\x62\x65\x72"](
        point["\x74\x69\x6d\x65"]
      );
      hpr["\x70\x75\x73\x68"]({
        name: "\x70\x6f\x69\x6e\x74",
        time: timeCount,
        h: Cesium["\x4d\x61\x74\x68"]["\x74\x6f\x44\x65\x67\x72\x65\x65\x73"](point["\x68\x65\x61\x64\x69\x6e\x67"]),
        p: Cesium["\x4d\x61\x74\x68"]["\x74\x6f\x44\x65\x67\x72\x65\x65\x73"](point["\x70\x69\x74\x63\x68"]),
        r: point["\x72\x61\x6e\x67\x65"]
      });
    }
  );
  let HPRProperty = function (hpr) {
    this["\x68\x70\x72"] = hpr;
  };
  HPRProperty["\x70\x72\x6f\x74\x6f\x74\x79\x70\x65"]["\x67\x65\x74\x56\x61\x6c\x75\x65"] = function (time) {
    let result = null;
    let startHpr = null;
    let endHpr = null;
    for (let i = 0; i < hpr["\x6c\x65\x6e\x67\x74\x68"]; i++) {
      if (time < hpr[i]["\x74\x69\x6d\x65"]) {
        if (i - 1 < 0) {
          startHpr = hpr[i];
        } else {
          startHpr = hpr[i - 1];
        }
        endHpr = hpr[i];
        break;
      }
    }
    if (startHpr && endHpr) {
      let rate =
        (time - startHpr["\x74\x69\x6d\x65"]) /
        (endHpr["\x74\x69\x6d\x65"] - startHpr["\x74\x69\x6d\x65"]);
      let h = getDegrees(startHpr["\x68"], endHpr["\x68"], rate);
      let p = getDegrees(startHpr["\x70"], endHpr["\x70"], rate);
      let r = (endHpr["\x72"] - startHpr["\x72"]) * rate + startHpr["\x72"];
      result = {h: h, p: p, r: r};
    }

    function getDegrees(wOJkpj1, ozfI2, tszW3) {
      let difDegrees = ozfI2 - wOJkpj1;
      if (difDegrees < -180) {
        difDegrees = 360 + difDegrees;
      } else if (difDegrees > 180) {
        difDegrees = difDegrees - 360;
      }
      let degrees = wOJkpj1 + tszW3 * difDegrees;
      return degrees;
    }

    return result;
  };
  let hprHPRProperty = new HPRProperty(hpr);
  return hprHPRProperty;
}

//根据两点计算距离
function calculateDistance(point1, point2) {
  /**根据经纬度计算出距离**/
  let geodesic = new Cesium.EllipsoidGeodesic();
  geodesic.setEndPoints(point1, point2);
  let d = geodesic.surfaceDistance;
  //返回两点之间的距离
  d = Math.sqrt(Math.pow(d, 2) + Math.pow(point1.height - point2.height, 2));
  return d;
}

//生成随机id
export const guid = function () {
  let d = new Date().getTime();
  let uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
};

//遍历点位，根据id执行输入操作
function forEachPointTodo(pointid, func) {
  flyData.points.forEach((point, i) => {
    if (point.id === pointid) {
      func(point, i);
    }
  });
}

//移除监听器
function removeSceneListener(viewer) {
  let listener = tempGlobal[FlightListener];
  viewer.scene.postUpdate.removeEventListener(listener);
  removeTempGlobal(FlightListener);
}

function removeTempGlobal(name) {
  delete tempGlobal[name];
}
