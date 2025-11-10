// Copyright (c) 2025 delfineonx
// This product includes "Block Raycaster" created by delfineonx.
// Licensed under the Apache License, Version 2.0 (the "License").

BR = {
  INFINITY: 1e48,
  UNIT_ALPHA: 1e-3,
  default: {
    directionType: null,
    maxDistance: null,
    startOffset: null,
    cellSize: null,
  },
  cache: [
    [null, null],       //  0: result
    [null, null, null], //  1: dirVec
    [null, 1],          //  2: dirInvVecNorm

    [null, 0],          //  3: directionType
    [null, 6],          //  4: maxDistance
    [null, 0],          //  5: startOffset
    [null, 1],          //  6: cellSize
  ],

  dispatcher: [
    null,
    null,
    null,
  ],
};

const BRdefault = BR.default;
const BRcache = BR.cache;
Object.defineProperty(BRdefault, "directionType", {
  configurable: true,
  get: () => {
    return BRcache[3][1];
  },
  set: (value) => {
    BRcache[3][1] = value;
  },
});
Object.defineProperty(BRdefault, "maxDistance", {
  configurable: true,
  get: () => {
    return BRcache[4][1];
  },
  set: (value) => {
    BRcache[4][1] = value;
  },
});
Object.defineProperty(BRdefault, "startOffset", {
  configurable: true,
  get: () => {
    return BRcache[5][1];
  },
  set: (value) => {
    BRcache[5][1] = value;
  },
});
Object.defineProperty(BRdefault, "cellSize", {
  configurable: true,
  get: () => {
    return BRcache[6][1];
  },
  set: (value) => {
    BRcache[6][1] = value;
  },
});
void 0;

// --------------------------------------------------

// angle direction to vector
BR.dispatcher[0] = {
  // Range-reduction constants
  INV_PI_2:  0.6366197723675814,    // 2/pi
  PI_2_HI: 1.5707963267948966,      // high part of pi/2
  PI_2_LO:  6.123233995736766e-17,  // low  part so HI+LO == pi/2 exactly

  // Angle conversion
  DEG_TO_RAD: 0.017453292519943295, // π/180

  // Taylor series coefficients for |reducedAngle| <= pi/2

  // sin(r) = r − r^3/3! + r^5/5! − r^7/7! + r^9/9! − r^11/11! + r^13/13!
  SIN_C13: -1.6059043836821613e-10, // −1/13!
  SIN_C11:  2.5052108385441720e-08, // +1/11!
  SIN_C09: -2.7557319223985893e-06, // −1/9!
  SIN_C07:  1.9841269841269840e-04, // +1/7!
  SIN_C05: -8.3333333333333333e-03, // −1/5!
  SIN_C03:  1.6666666666666667e-01, // +1/3!

  // cos(r) = 1 − r^2/2! + r^4/4! − r^6/6! + r^8/8! − r^10/10! + r^12/12!
  COS_C12:  2.0876756987868100e-09, // +1/12!
  COS_C10: -2.7557319223985890e-07, // −1/10!
  COS_C08:  2.4801587301587300e-05, // +1/8!
  COS_C06: -1.3888888888888890e-03, // −1/6!
  COS_C04:  4.1666666666666664e-02, // +1/4!
  COS_C02: -5.0000000000000000e-01, // −1/2!

  // Pass-in buffer
  direction: null, // [yaw, pitch] or [theta, phi]

  // input: [yawRad, pitchRad]
  get 1() {
    const yawRad = this.direction[0];
    const pitchRad = this.direction[1];

    let scaledAngle,
      quarterTurns,
      reducedAngle,
      reducedAngle2,
      s,
      c,
      quadrant,
      shouldSwap,
      signedFlip;

    // sincos(yawRad) -> (sinYaw, cosYaw)
    let sinYaw, cosYaw;
    {
      scaledAngle = yawRad * this.INV_PI_2;
      quarterTurns = scaledAngle + 0.5 - (scaledAngle < 0) | 0;

      reducedAngle = (yawRad - quarterTurns * this.PI_2_HI) - quarterTurns * this.PI_2_LO;
      reducedAngle2  = reducedAngle * reducedAngle;

      s = this.SIN_C13;
      s = s * reducedAngle2 + this.SIN_C11;
      s = s * reducedAngle2 + this.SIN_C09;
      s = s * reducedAngle2 + this.SIN_C07;
      s = s * reducedAngle2 + this.SIN_C05;
      s = s * reducedAngle2 + this.SIN_C03;
      const sinReduced = reducedAngle + reducedAngle * reducedAngle2 * (-s);

      c = this.COS_C12;
      c = c * reducedAngle2 + this.COS_C10;
      c = c * reducedAngle2 + this.COS_C08;
      c = c * reducedAngle2 + this.COS_C06;
      c = c * reducedAngle2 + this.COS_C04;
      c = c * reducedAngle2 + this.COS_C02;
      const cosReduced = 1 + c * reducedAngle2;

      quadrant = (quarterTurns & 3);
      shouldSwap = quadrant & 1;
      signedFlip = 1 - ((quadrant >> 1) << 1);

      sinYaw = (sinReduced * (1 - shouldSwap) + cosReduced * shouldSwap) * signedFlip;
      cosYaw = (cosReduced * (1 - shouldSwap) + (-sinReduced) * shouldSwap) * signedFlip;
    }

    // sincos(pitchRad) -> (sinPitch, cosPitch)
    let sinPitch, cosPitch;
    {
      scaledAngle = pitchRad * this.INV_PI_2;
      quarterTurns = scaledAngle + 0.5 - (scaledAngle < 0) | 0;

      reducedAngle = (pitchRad - quarterTurns * this.PI_2_HI) - quarterTurns * this.PI_2_LO;
      reducedAngle2 = reducedAngle * reducedAngle;

      s = this.SIN_C13;
      s = s * reducedAngle2 + this.SIN_C11;
      s = s * reducedAngle2 + this.SIN_C09;
      s = s * reducedAngle2 + this.SIN_C07;
      s = s * reducedAngle2 + this.SIN_C05;
      s = s * reducedAngle2 + this.SIN_C03;
      const sinReduced = reducedAngle + reducedAngle * reducedAngle2 * (-s);

      c = this.COS_C12;
      c = c * reducedAngle2 + this.COS_C10;
      c = c * reducedAngle2 + this.COS_C08;
      c = c * reducedAngle2 + this.COS_C06;
      c = c * reducedAngle2 + this.COS_C04;
      c = c * reducedAngle2 + this.COS_C02;
      const cosReduced = 1 + c * reducedAngle2;

      quadrant = (quarterTurns & 3);
      shouldSwap = quadrant & 1;
      signedFlip = 1 - ((quadrant >> 1) << 1);

      sinPitch = (sinReduced * (1 - shouldSwap) + cosReduced * shouldSwap) * signedFlip;
      cosPitch = (cosReduced * (1 - shouldSwap) + (-sinReduced) * shouldSwap) * signedFlip;
    }

    const _dirVec_ = BR.cache[1];
    _dirVec_[0] = -cosPitch * sinYaw;
    _dirVec_[1] = sinPitch;
    _dirVec_[2] = -cosPitch * cosYaw;

    this.direction = null;
  },

  // input: [yawDeg, pitchDeg]
  get 2() {
    const yawRad = this.direction[0] * this.DEG_TO_RAD;
    const pitchRad = this.direction[1] * this.DEG_TO_RAD;

    let scaledAngle,
      quarterTurns,
      reducedAngle,
      reducedAngle2,
      s,
      c,
      quadrant,
      shouldSwap,
      signedFlip;

    // sincos(yawRad) -> (sinYaw, cosYaw)
    let sinYaw, cosYaw;
    {
      scaledAngle = yawRad * this.INV_PI_2;
      quarterTurns = scaledAngle + 0.5 - (scaledAngle < 0) | 0;

      reducedAngle = (yawRad - quarterTurns * this.PI_2_HI) - quarterTurns * this.PI_2_LO;
      reducedAngle2  = reducedAngle * reducedAngle;

      s = this.SIN_C13;
      s = s * reducedAngle2 + this.SIN_C11;
      s = s * reducedAngle2 + this.SIN_C09;
      s = s * reducedAngle2 + this.SIN_C07;
      s = s * reducedAngle2 + this.SIN_C05;
      s = s * reducedAngle2 + this.SIN_C03;
      const sinReduced = reducedAngle + reducedAngle * reducedAngle2 * (-s);

      c = this.COS_C12;
      c = c * reducedAngle2 + this.COS_C10;
      c = c * reducedAngle2 + this.COS_C08;
      c = c * reducedAngle2 + this.COS_C06;
      c = c * reducedAngle2 + this.COS_C04;
      c = c * reducedAngle2 + this.COS_C02;
      const cosReduced = 1 + c * reducedAngle2;

      quadrant = (quarterTurns & 3);
      shouldSwap = quadrant & 1;
      signedFlip = 1 - ((quadrant >> 1) << 1);

      sinYaw = (sinReduced * (1 - shouldSwap) + cosReduced * shouldSwap) * signedFlip;
      cosYaw = (cosReduced * (1 - shouldSwap) + (-sinReduced) * shouldSwap) * signedFlip;
    }

    // sincos(pitchRad) -> (sinPitch, cosPitch)
    let sinPitch, cosPitch;
    {
      scaledAngle = pitchRad * this.INV_PI_2;
      quarterTurns = scaledAngle + 0.5 - (scaledAngle < 0) | 0;

      reducedAngle = (pitchRad - quarterTurns * this.PI_2_HI) - quarterTurns * this.PI_2_LO;
      reducedAngle2 = reducedAngle * reducedAngle;

      s = this.SIN_C13;
      s = s * reducedAngle2 + this.SIN_C11;
      s = s * reducedAngle2 + this.SIN_C09;
      s = s * reducedAngle2 + this.SIN_C07;
      s = s * reducedAngle2 + this.SIN_C05;
      s = s * reducedAngle2 + this.SIN_C03;
      const sinReduced = reducedAngle + reducedAngle * reducedAngle2 * (-s);

      c = this.COS_C12;
      c = c * reducedAngle2 + this.COS_C10;
      c = c * reducedAngle2 + this.COS_C08;
      c = c * reducedAngle2 + this.COS_C06;
      c = c * reducedAngle2 + this.COS_C04;
      c = c * reducedAngle2 + this.COS_C02;
      const cosReduced = 1 + c * reducedAngle2;

      quadrant = (quarterTurns & 3);
      shouldSwap = quadrant & 1;
      signedFlip = 1 - ((quadrant >> 1) << 1);

      sinPitch = (sinReduced * (1 - shouldSwap) + cosReduced * shouldSwap) * signedFlip;
      cosPitch = (cosReduced * (1 - shouldSwap) + (-sinReduced) * shouldSwap) * signedFlip;
    }

    const _dirVec_ = BR.cache[1];
    _dirVec_[0] = -cosPitch * sinYaw;
    _dirVec_[1] = sinPitch;
    _dirVec_[2] = -cosPitch * cosYaw;

    this.direction = null;
  },
};
void 0;

// --------------------------------------------------

// inverse vector norm
BR.dispatcher[1] = {
  vecNormSquared: null,

  get 1() {
    const vecNormSquared = this.vecNormSquared;
    const isVecNormZero = +(vecNormSquared === 0);
    const needHalfFactor = +(vecNormSquared >= 2);
    const needDoubleFactor = +(vecNormSquared < 0.5);
    const scaleFactor = ((1 - needHalfFactor) + 0.5 * needHalfFactor) * ((1 - needDoubleFactor) + 2 * needDoubleFactor);
    const scaledInvSqrtInput = vecNormSquared * scaleFactor * scaleFactor + isVecNormZero;
    const deviation = scaledInvSqrtInput - 1;
    let invSqrt = 1 - 0.5 * deviation + 0.375 * deviation * deviation;
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    const invVecNorm = scaleFactor * invSqrt * (1 - isVecNormZero);
    this.vecNormSquared = null;
    return invVecNorm;
  },
};
void 0;

// --------------------------------------------------

// idempotency
BR.dispatcher[2] = {
  state: 1,
  result: null,

  input: [
    null, //  0: dirX
    null, //  1: dirY
    null, //  2: dirZ
    null, //  3: cell
    null, //  4: maxDist
    null, //  5: dirInvVecNorm
    null, //  6: startOffsetDistance
    null, //  7: startX
    null, //  8: startY
    null, //  9: startZ
  ],

  layout: [
    null, //  0: dirX
    null, //  1: dirY
    null, //  2: dirZ
    null, //  3: startX (with offset)
    null, //  4: startY (with offset)
    null, //  5: startZ (with offset)
    null, //  6: voxelX
    null, //  7: voxelY
    null, //  8: voxelZ
    null, //  9: stepXSign
    null, // 10: stepYSign
    null, // 11: stepZSign
    null, // 12: timeStrideX
    null, // 13: timeStrideY
    null, // 14: timeStrideZ
    null, // 15: timeNextX
    null, // 16: timeNextY
    null, // 17: timeNextZ
    null, // 18: dirInvVecNorm
    null, // 19: startOffsetDistance
    null, // 20: maxTime
  ],

  get 1() {
    const input = this.input;
    const layout = this.layout;

    const dirX = layout[0] = input[0];
    const dirY = layout[1] = input[1];
    const dirZ = layout[2] = input[2];

    const cell = input[3];

    const startX = layout[3] = input[7];
    const startY = layout[4] = input[8];
    const startZ = layout[5] = input[9];

    const startCellX = startX / cell;
    const startCellY = startY / cell;
    const startCellZ = startZ / cell;

    let temp = startCellX | 0;
    layout[6] = temp - (temp > startCellX);
    temp = startCellY | 0;
    layout[7] = temp - (temp > startCellY);
    temp = startCellZ | 0;
    layout[8] = temp - (temp > startCellZ);

    const stepXSign = layout[9]  = (dirX > 0) - (dirX < 0);
    const stepYSign = layout[10] = (dirY > 0) - (dirY < 0);
    const stepZSign = layout[11] = (dirZ > 0) - (dirZ < 0);

    const absDirX = dirX * stepXSign;
    const absDirY = dirY * stepYSign;
    const absDirZ = dirZ * stepZSign;

    const isZeroDirX = +(absDirX === 0);
    const isZeroDirY = +(absDirY === 0);
    const isZeroDirZ = +(absDirZ === 0);

    layout[12] = cell / (absDirX + isZeroDirX);
    layout[13] = cell / (absDirY + isZeroDirY);
    layout[14] = cell / (absDirZ + isZeroDirZ);

    let timeNextX = (((layout[6] + ((stepXSign + 1) >>> 1)) * cell - startX) * stepXSign) / (absDirX + isZeroDirX) + isZeroDirX * BR.INFINITY;
    let timeNextY = (((layout[7] + ((stepYSign + 1) >>> 1)) * cell - startY) * stepYSign) / (absDirY + isZeroDirY) + isZeroDirY * BR.INFINITY;
    let timeNextZ = (((layout[8] + ((stepZSign + 1) >>> 1)) * cell - startZ) * stepZSign) / (absDirZ + isZeroDirZ) + isZeroDirZ * BR.INFINITY;

    const isAbsDirXlessY = +(absDirX < absDirY);
    const maxAbsDirXY = absDirX * (1 - isAbsDirXlessY) + absDirY * isAbsDirXlessY;
    const isMaxAbsDirXYlessZ = +(maxAbsDirXY < absDirZ);
    const maxAbsDir = maxAbsDirXY * (1 - isMaxAbsDirXYlessZ) + absDirZ * isMaxAbsDirXYlessZ;
    const timeEpsilon = cell / (maxAbsDir + (maxAbsDir === 0)) * 1e-9;
    layout[15] = timeNextX += (timeNextX === 0) * timeEpsilon;
    layout[16] = timeNextY += (timeNextY === 0) * timeEpsilon;
    layout[17] = timeNextZ += (timeNextZ === 0) * timeEpsilon;

    layout[18] = input[5];
    layout[19] = input[6];
    layout[20] = input[4] * layout[18] + timeEpsilon;

    this.state = 2;
    this[this.state];
  },

  get 2() {
    const layout = this.layout;

    const stepXSign = layout[9],
      stepYSign = layout[10],
      stepZSign = layout[11],
      timeStrideX = layout[12],
      timeStrideY = layout[13],
      timeStrideZ = layout[14],
      maxTime = layout[20];

    let voxelX = layout[6],
      voxelY = layout[7],
      voxelZ = layout[8],
      timeNextX = layout[15],
      timeNextY = layout[16],
      timeNextZ = layout[17];

    let pickX,
      pickY,
      pickZ,
      timeHit,
      blockId,
      isWithin;
    while (true) {
      layout[6] = voxelX;
      layout[7] = voxelY;
      layout[8] = voxelZ;
      layout[15] = timeNextX;
      layout[16] = timeNextY;
      layout[17] = timeNextZ;

      pickX = (timeNextX < timeNextY) & (timeNextX < timeNextZ);
      pickY = (timeNextY <= timeNextZ) & (1 - pickX);
      pickZ = 1 - pickX - pickY;

      timeHit = timeNextX * pickX + timeNextY * pickY + timeNextZ * pickZ;

      voxelX += stepXSign * pickX;
      voxelY += stepYSign * pickY;
      voxelZ += stepZSign * pickZ;

      timeNextX += timeStrideX * pickX;
      timeNextY += timeStrideY * pickY;
      timeNextZ += timeStrideZ * pickZ;

      blockId = api.getBlockId(voxelX, voxelY, voxelZ);
      isWithin = (timeHit <= maxTime);
      if (!blockId & isWithin) { continue; }
      break;
    }

    const normalX = -stepXSign * pickX;
    const normalY = -stepYSign * pickY;
    const normalZ = -stepZSign * pickZ;

    const offsetDistance = timeHit / (layout[18] + (layout[18] === 0));

    const _result_ = BR.cache[0];
    _result_[1] = {
      blockId,
      position: [voxelX, voxelY, voxelZ],
      normal: [normalX, normalY, normalZ],
      adjacent: [voxelX + normalX, voxelY + normalY, voxelZ + normalZ],
      point: [layout[3] + layout[0] * timeHit, layout[4] + layout[1] * timeHit, layout[5] + layout[2] * timeHit],
      distance: offsetDistance + layout[19],
      offsetDistance,
    };
    this.result = _result_[!!blockId & isWithin];
    _result_[1] = null;
    this.state = 1;
  },
};
void 0;

// --------------------------------------------------

BR.iget = (startPosition, direction, directionType, maxDistance, startOffset, cellSize) => {
  const dispatcher = BR.dispatcher;
  const cache = BR.cache;
  const inpu = dispatcher[2].input;

  const _dirVec_ = cache[1];
  _dirVec_[0] = direction[0];
  _dirVec_[1] = direction[1];
  _dirVec_[2] = direction[2];
  dispatcher[0].direction = direction;
  cache[3][0] = directionType | 0;
  dispatcher[0][cache[3][+!(directionType | 0)]];
  const dirX = inpu[0] = _dirVec_[0];
  const dirY = inpu[1] = _dirVec_[1];
  const dirZ = inpu[2] = _dirVec_[2];

  cache[6][0] = cellSize | 0;
  inpu[3] = cache[6][+!((cellSize | 0) > 0)];

  cache[4][0] = maxDistance;
  inpu[4] = cache[4][+!(maxDistance > 0)];

  const dirVecNormSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
  const absDeltaUnitSquared = (dirVecNormSquared - 1) * (1 - (((dirVecNormSquared - 1) < 0) << 1));
  const unitEpsilon = (2 * BR.UNIT_ALPHA * inpu[3]) / inpu[4];
  const isUnitDirVec = (absDeltaUnitSquared <= unitEpsilon);
  dispatcher[1].vecNormSquared = dirVecNormSquared;
  cache[2][0] = dispatcher[1][+!isUnitDirVec];
  inpu[5] = cache[2][+isUnitDirVec];

  cache[5][0] = startOffset;
  inpu[6] = cache[5][(startOffset === undefined) | (startOffset === null)];
  const startOffsetTime = inpu[6] * inpu[5];

  inpu[7] = startPosition[0] + dirX * startOffsetTime;
  inpu[8] = startPosition[1] + dirY * startOffsetTime;
  inpu[9] = startPosition[2] + dirZ * startOffsetTime;

  dispatcher[2][dispatcher[2].state];

  const result = dispatcher[2].result;
  dispatcher[2].result = null;
  return result;
};
void 0;

// --------------------------------------------------

BR.get = (startPosition, direction, directionType, maxDistance, startOffset, cellSize) => {
  const dispatcher = BR.dispatcher;
  const cache = BR.cache;

  const _dirVec_ = cache[1];
  _dirVec_[0] = direction[0];
  _dirVec_[1] = direction[1];
  _dirVec_[2] = direction[2];
  dispatcher[0].direction = direction;
  cache[3][0] = directionType | 0;
  dispatcher[0][cache[3][+!(directionType | 0)]];
  const dirX = _dirVec_[0];
  const dirY = _dirVec_[1];
  const dirZ = _dirVec_[2];

  cache[6][0] = cellSize | 0;
  const cell = cache[6][+!((cellSize | 0) > 0)];

  cache[4][0] = maxDistance;
  const maxDist = cache[4][+!(maxDistance > 0)];

  const dirVecNormSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
  const absDeltaUnitSquared = (dirVecNormSquared - 1) * (1 - (((dirVecNormSquared - 1) < 0) << 1));
  const unitEpsilon = (2 * BR.UNIT_ALPHA * cell) / maxDist;
  const isUnitDirVec = (absDeltaUnitSquared <= unitEpsilon);
  dispatcher[1].vecNormSquared = dirVecNormSquared;
  cache[2][0] = dispatcher[1][+!isUnitDirVec];
  const dirInvVecNorm = cache[2][+isUnitDirVec];

  cache[5][0] = startOffset;
  const startOffsetDistance = cache[5][(startOffset === undefined) | (startOffset === null)];
  const startOffsetTime = startOffsetDistance * dirInvVecNorm;

  const startX = startPosition[0] + dirX * startOffsetTime;
  const startY = startPosition[1] + dirY * startOffsetTime;
  const startZ = startPosition[2] + dirZ * startOffsetTime;

  const startCellX = startX / cell;
  const startCellY = startY / cell;
  const startCellZ = startZ / cell;

  let temp = startCellX | 0;
  let voxelX = temp - (temp > startCellX);
  temp = startCellY | 0;
  let voxelY = temp - (temp > startCellY);
  temp = startCellZ | 0;
  let voxelZ = temp - (temp > startCellZ);

  const stepXSign = (dirX > 0) - (dirX < 0);
  const stepYSign = (dirY > 0) - (dirY < 0);
  const stepZSign = (dirZ > 0) - (dirZ < 0);

  const absDirX = dirX * stepXSign;
  const absDirY = dirY * stepYSign;
  const absDirZ = dirZ * stepZSign;

  const isZeroDirX = +(absDirX === 0);
  const isZeroDirY = +(absDirY === 0);
  const isZeroDirZ = +(absDirZ === 0);

  const timeStrideX = cell / (absDirX + isZeroDirX);
  const timeStrideY = cell / (absDirY + isZeroDirY);
  const timeStrideZ = cell / (absDirZ + isZeroDirZ);

  let timeNextX = (((voxelX + ((stepXSign + 1) >>> 1)) * cell - startX) * stepXSign) / (absDirX + isZeroDirX) + isZeroDirX * BR.INFINITY;
  let timeNextY = (((voxelY + ((stepYSign + 1) >>> 1)) * cell - startY) * stepYSign) / (absDirY + isZeroDirY) + isZeroDirY * BR.INFINITY;
  let timeNextZ = (((voxelZ + ((stepZSign + 1) >>> 1)) * cell - startZ) * stepZSign) / (absDirZ + isZeroDirZ) + isZeroDirZ * BR.INFINITY;

  const isAbsDirXlessY = +(absDirX < absDirY);
  const maxAbsDirXY = absDirX * (1 - isAbsDirXlessY) + absDirY * isAbsDirXlessY;
  const isMaxAbsDirXYlessZ = +(maxAbsDirXY < absDirZ);
  const maxAbsDir = maxAbsDirXY * (1 - isMaxAbsDirXYlessZ) + absDirZ * isMaxAbsDirXYlessZ;
  const timeEpsilon = cell / (maxAbsDir + (maxAbsDir === 0)) * 1e-9;
  timeNextX += (timeNextX === 0) * timeEpsilon;
  timeNextY += (timeNextY === 0) * timeEpsilon;
  timeNextZ += (timeNextZ === 0) * timeEpsilon;

  const maxTime = maxDist * dirInvVecNorm + timeEpsilon;

  let pickX,
    pickY,
    pickZ,
    timeHit,
    blockId,
    isWithin;
  while (true) {
    pickX = (timeNextX < timeNextY) & (timeNextX < timeNextZ);
    pickY = (timeNextY <= timeNextZ) & (1 - pickX);
    pickZ = 1 - pickX - pickY;

    timeHit = timeNextX * pickX + timeNextY * pickY + timeNextZ * pickZ;

    voxelX += stepXSign * pickX;
    voxelY += stepYSign * pickY;
    voxelZ += stepZSign * pickZ;

    timeNextX += timeStrideX * pickX;
    timeNextY += timeStrideY * pickY;
    timeNextZ += timeStrideZ * pickZ;

    blockId = api.getBlockId(voxelX, voxelY, voxelZ);
    isWithin = (timeHit <= maxTime);
    if (!blockId & isWithin) { continue; }
    break;
  }

  const normalX = -stepXSign * pickX;
  const normalY = -stepYSign * pickY;
  const normalZ = -stepZSign * pickZ;

  const offsetDistance = timeHit / (dirInvVecNorm + (dirInvVecNorm === 0));

  const _result_ = cache[0];
  _result_[1] = {
    blockId,
    position: [voxelX, voxelY, voxelZ],
    normal: [normalX, normalY, normalZ],
    adjacent: [voxelX + normalX, voxelY + normalY, voxelZ + normalZ],
    point: [startX + dirX * timeHit, startY + dirY * timeHit, startZ + dirZ * timeHit],
    distance: offsetDistance + startOffsetDistance,
    offsetDistance,
  };
  const result = _result_[!!blockId & isWithin];
  _result_[1] = null;

  return result;
};
void 0;

// --------------------------------------------------

BR.maxSteps = (startPosition, direction, directionType, maxDistance, startOffset, cellSize) => {
  const dispatcher = BR.dispatcher;
  const cache = BR.cache;

  const _dirVec_ = cache[1];
  _dirVec_[0] = direction[0];
  _dirVec_[1] = direction[1];
  _dirVec_[2] = direction[2];
  dispatcher[0].direction = direction;
  cache[3][0] = directionType | 0;
  dispatcher[0][cache[3][+!(directionType | 0)]];
  const dirX = _dirVec_[0];
  const dirY = _dirVec_[1];
  const dirZ = _dirVec_[2];

  cache[6][0] = cellSize | 0;
  const cell = cache[6][+!((cellSize | 0) > 0)];

  cache[4][0] = maxDistance;
  const maxDist = cache[4][+!(maxDistance > 0)];

  const dirVecNormSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
  const absDeltaUnitSquared = (dirVecNormSquared - 1) * (1 - (((dirVecNormSquared - 1) < 0) << 1));
  const unitEpsilon = (2 * BR.UNIT_ALPHA * cell) / maxDist;
  const isUnitDirVec = (absDeltaUnitSquared <= unitEpsilon);
  dispatcher[1].vecNormSquared = dirVecNormSquared;
  cache[2][0] = dispatcher[1][+!isUnitDirVec];
  const dirInvVecNorm = cache[2][+isUnitDirVec];

  cache[5][0] = startOffset;
  const startOffsetDistance = cache[5][(startOffset === undefined) | (startOffset === null)];
  const startOffsetTime = startOffsetDistance * dirInvVecNorm;

  const startX = startPosition[0] + dirX * startOffsetTime;
  const startY = startPosition[1] + dirY * startOffsetTime;
  const startZ = startPosition[2] + dirZ * startOffsetTime;

  const startCellX = startX / cell;
  const startCellY = startY / cell;
  const startCellZ = startZ / cell;

  let temp = startCellX | 0;
  let voxelX = temp - (temp > startCellX);
  temp = startCellY | 0;
  let voxelY = temp - (temp > startCellY);
  temp = startCellZ | 0;
  let voxelZ = temp - (temp > startCellZ);

  const stepXSign = (dirX > 0) - (dirX < 0);
  const stepYSign = (dirY > 0) - (dirY < 0);
  const stepZSign = (dirZ > 0) - (dirZ < 0);

  const absDirX = dirX * stepXSign;
  const absDirY = dirY * stepYSign;
  const absDirZ = dirZ * stepZSign;

  const isZeroDirX = +(absDirX === 0);
  const isZeroDirY = +(absDirY === 0);
  const isZeroDirZ = +(absDirZ === 0);

  const timeStrideX = cell / (absDirX + isZeroDirX);
  const timeStrideY = cell / (absDirY + isZeroDirY);
  const timeStrideZ = cell / (absDirZ + isZeroDirZ);

  let timeNextX = (((voxelX + ((stepXSign + 1) >>> 1)) * cell - startX) * stepXSign) / (absDirX + isZeroDirX) + isZeroDirX * BR.INFINITY;
  let timeNextY = (((voxelY + ((stepYSign + 1) >>> 1)) * cell - startY) * stepYSign) / (absDirY + isZeroDirY) + isZeroDirY * BR.INFINITY;
  let timeNextZ = (((voxelZ + ((stepZSign + 1) >>> 1)) * cell - startZ) * stepZSign) / (absDirZ + isZeroDirZ) + isZeroDirZ * BR.INFINITY;

  const isAbsDirXlessY = +(absDirX < absDirY);
  const maxAbsDirXY = absDirX * (1 - isAbsDirXlessY) + absDirY * isAbsDirXlessY;
  const isMaxAbsDirXYlessZ = +(maxAbsDirXY < absDirZ);
  const maxAbsDir = maxAbsDirXY * (1 - isMaxAbsDirXYlessZ) + absDirZ * isMaxAbsDirXYlessZ;
  const timeEpsilon = cell / (maxAbsDir + (maxAbsDir === 0)) * 1e-9;
  timeNextX += (timeNextX === 0) * timeEpsilon;
  timeNextY += (timeNextY === 0) * timeEpsilon;
  timeNextZ += (timeNextZ === 0) * timeEpsilon;

  const maxTime = maxDist * dirInvVecNorm + timeEpsilon;

  let isFirstWithinMax,
    axisSteps,
    lastIncludedTime,
    isLastBeyondMax;

  let steps = 0;

  {
    isFirstWithinMax = +(timeNextX <= maxTime);
    axisSteps = isFirstWithinMax * ((((maxTime - timeNextX) / timeStrideX) | 0) + 1);
    lastIncludedTime = timeNextX + (axisSteps - isFirstWithinMax) * timeStrideX;
    isLastBeyondMax = +(lastIncludedTime > maxTime);
    axisSteps -= isLastBeyondMax;
    lastIncludedTime -= (isLastBeyondMax * timeStrideX);
    axisSteps += ((lastIncludedTime + timeStrideX) <= maxTime);
    axisSteps *= (absDirX !== 0);
    steps += axisSteps;
  }

  {
    isFirstWithinMax = +(timeNextY <= maxTime);
    axisSteps = isFirstWithinMax * ((((maxTime - timeNextY) / timeStrideY) | 0) + 1);
    lastIncludedTime = timeNextY + (axisSteps - isFirstWithinMax) * timeStrideY;
    isLastBeyondMax = +(lastIncludedTime > maxTime);
    axisSteps -= isLastBeyondMax;
    lastIncludedTime -= (isLastBeyondMax * timeStrideY);
    axisSteps += ((lastIncludedTime + timeStrideY) <= maxTime);
    axisSteps *= +(absDirY !== 0);
    steps += axisSteps;
  }

  {
    isFirstWithinMax = +(timeNextZ <= maxTime);
    axisSteps = isFirstWithinMax * ((((maxTime - timeNextZ) / timeStrideZ) | 0) + 1);
    lastIncludedTime = timeNextZ + (axisSteps - isFirstWithinMax) * timeStrideZ;
    isLastBeyondMax = +(lastIncludedTime > maxTime);
    axisSteps -= isLastBeyondMax;
    lastIncludedTime -= (isLastBeyondMax * timeStrideZ);
    axisSteps += ((lastIncludedTime + timeStrideZ) <= maxTime);
    axisSteps *= +(absDirZ !== 0);
    steps += axisSteps;
  }

  return steps;
};
void 0;

// --------------------------------------------------

Object.seal(BR);

globalThis.BlockRaycaster = BR;
