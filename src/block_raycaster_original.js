// Copyright (c) 2025 delfineonx
// This product includes "Block Raycaster" created by delfineonx.
// Licensed under the Apache License, Version 2.0 (the "License").

globalThis.BR = {
  INFINITY: 1e48,

  default: {
    directionType: null,
    maxDistance: null,
    startOffset: null,
    cellSize: null,
  },

  cache: [
    null,  //  0: "temp value"
    1,     //  1: directionType
    null,  //  2: maxAbsDir
    1,     //  3: cellSize
    6,     //  4: maxDistance
    null,  //  5: dirVecX / dirYaw
    null,  //  6: dirVecY / dirPitch
    null,  //  7: dirVecZ / undefined
    0,     //  8: startOffset
    null,  //  9: result
  ],

  dispatcher: {
    converter: {
      // Range-reduction constants
      INV_PI_2:  0.6366197723675814,    // 2/pi
      PI_2_HI: 1.5707963267948966,      // high part of pi/2
      PI_2_LO:  6.123233995736766e-17,  // low part so HI+LO == pi/2 exactly

      // Angle unit conversion constants
      DEG_TO_RAD: 0.017453292519943295, // pi/180
      RAD_TO_DEG: 57.29577951308232,    // 180/pi

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

      // atan(a) = a - a^3/3 + a^5/5 - a^7/7 (Horner form)
      ATAN_P7: -0.14285714285714285,    // -1/7
      ATAN_P5:  0.2,                    // +1/5
      ATAN_P3: -0.3333333333333333,     // -1/3

      direction: null,

      /*
      2: 2 -> 1
      3: 3 -> 1
      4: 1 -> 2
      5: 1 -> 3
      6: 2 -> 3
      7: 3 -> 2
      */

      // [yawRad, pitchRad] -> [dirX, dirY, dirZ]
      get 2() {
        const yawRad = this.direction[0];
        const pitchRad = this.direction[1];

        let scaledAngle,
            quarterTurns,
            reducedAngle,
            reducedAngle2,
            poly,
            sinReduced,
            cosReduced,
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

          poly = this.SIN_C13;
          poly = poly * reducedAngle2 + this.SIN_C11;
          poly = poly * reducedAngle2 + this.SIN_C09;
          poly = poly * reducedAngle2 + this.SIN_C07;
          poly = poly * reducedAngle2 + this.SIN_C05;
          poly = poly * reducedAngle2 + this.SIN_C03;
          sinReduced = reducedAngle + reducedAngle * reducedAngle2 * (-poly);

          poly = this.COS_C12;
          poly = poly * reducedAngle2 + this.COS_C10;
          poly = poly * reducedAngle2 + this.COS_C08;
          poly = poly * reducedAngle2 + this.COS_C06;
          poly = poly * reducedAngle2 + this.COS_C04;
          poly = poly * reducedAngle2 + this.COS_C02;
          cosReduced = 1 + poly * reducedAngle2;

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

          poly = this.SIN_C13;
          poly = poly * reducedAngle2 + this.SIN_C11;
          poly = poly * reducedAngle2 + this.SIN_C09;
          poly = poly * reducedAngle2 + this.SIN_C07;
          poly = poly * reducedAngle2 + this.SIN_C05;
          poly = poly * reducedAngle2 + this.SIN_C03;
          sinReduced = reducedAngle + reducedAngle * reducedAngle2 * (-poly);

          poly = this.COS_C12;
          poly = poly * reducedAngle2 + this.COS_C10;
          poly = poly * reducedAngle2 + this.COS_C08;
          poly = poly * reducedAngle2 + this.COS_C06;
          poly = poly * reducedAngle2 + this.COS_C04;
          poly = poly * reducedAngle2 + this.COS_C02;
          cosReduced = 1 + poly * reducedAngle2;

          quadrant = (quarterTurns & 3);
          shouldSwap = quadrant & 1;
          signedFlip = 1 - ((quadrant >> 1) << 1);

          sinPitch = (sinReduced * (1 - shouldSwap) + cosReduced * shouldSwap) * signedFlip;
          cosPitch = (cosReduced * (1 - shouldSwap) + (-sinReduced) * shouldSwap) * signedFlip;
        }

        const cache = BR.cache;
        cache[5] = -cosPitch * sinYaw;
        cache[6] = sinPitch;
        cache[7] = -cosPitch * cosYaw;

        this.direction = null;
      },

      // [yawDeg, pitchDeg] -> [dirX, dirY, dirZ]
      get 3() {
        const yawRad = this.direction[0] * this.DEG_TO_RAD;
        const pitchRad = this.direction[1] * this.DEG_TO_RAD;

        let scaledAngle,
            quarterTurns,
            reducedAngle,
            reducedAngle2,
            poly,
            sinReduced,
            cosReduced,
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

          poly = this.SIN_C13;
          poly = poly * reducedAngle2 + this.SIN_C11;
          poly = poly * reducedAngle2 + this.SIN_C09;
          poly = poly * reducedAngle2 + this.SIN_C07;
          poly = poly * reducedAngle2 + this.SIN_C05;
          poly = poly * reducedAngle2 + this.SIN_C03;
          sinReduced = reducedAngle + reducedAngle * reducedAngle2 * (-poly);

          poly = this.COS_C12;
          poly = poly * reducedAngle2 + this.COS_C10;
          poly = poly * reducedAngle2 + this.COS_C08;
          poly = poly * reducedAngle2 + this.COS_C06;
          poly = poly * reducedAngle2 + this.COS_C04;
          poly = poly * reducedAngle2 + this.COS_C02;
          cosReduced = 1 + poly * reducedAngle2;

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

          poly = this.SIN_C13;
          poly = poly * reducedAngle2 + this.SIN_C11;
          poly = poly * reducedAngle2 + this.SIN_C09;
          poly = poly * reducedAngle2 + this.SIN_C07;
          poly = poly * reducedAngle2 + this.SIN_C05;
          poly = poly * reducedAngle2 + this.SIN_C03;
          sinReduced = reducedAngle + reducedAngle * reducedAngle2 * (-poly);

          poly = this.COS_C12;
          poly = poly * reducedAngle2 + this.COS_C10;
          poly = poly * reducedAngle2 + this.COS_C08;
          poly = poly * reducedAngle2 + this.COS_C06;
          poly = poly * reducedAngle2 + this.COS_C04;
          poly = poly * reducedAngle2 + this.COS_C02;
          cosReduced = 1 + poly * reducedAngle2;

          quadrant = (quarterTurns & 3);
          shouldSwap = quadrant & 1;
          signedFlip = 1 - ((quadrant >> 1) << 1);

          sinPitch = (sinReduced * (1 - shouldSwap) + cosReduced * shouldSwap) * signedFlip;
          cosPitch = (cosReduced * (1 - shouldSwap) + (-sinReduced) * shouldSwap) * signedFlip;
        }

        const cache = BR.cache;
        cache[5] = -cosPitch * sinYaw;
        cache[6] = sinPitch;
        cache[7] = -cosPitch * cosYaw;

        this.direction = null;
      },

      // [dirX, dirY, dirZ] -> [yawRad, pitchRad]
      get 4() {
        const dirX = this.direction[5];
        const dirY = this.direction[6];
        const dirZ = this.direction[7];

        const PI_2 = this.PI_2_HI + this.PI_2_LO;
        const PI = PI_2 + PI_2;

        let baseX,
            baseY,
            absX,
            absY,
            isAbsYgreaterAbsX,
            maxAbs,
            minAbs,
            ratio,
            ratio2,
            poly;

        let yawRad;
        // atan2(dirX, dirZ) -> yawRad
        {
          baseX = dirZ;
          baseY = dirX;

          absX = baseX * ((baseX > 0) - (baseX < 0));
          absY = baseY * ((baseY > 0) - (baseY < 0));

          // Ratio reduction
          isAbsYgreaterAbsX = +(absY > absX);
          maxAbs = absX + (absY - absX) * isAbsYgreaterAbsX;
          minAbs = absY + (absX - absY) * isAbsYgreaterAbsX;
          ratio = minAbs / (maxAbs + (maxAbs === 0));
          ratio2 = ratio * ratio;

          poly = this.ATAN_P7;
          poly = poly * ratio2 + this.ATAN_P5;
          poly = poly * ratio2 + this.ATAN_P3;
          poly = (poly * ratio2 + 1) * ratio;  // = atan(ratio)

          // Undo the reduction and fix quadrants
          yawRad = poly * (1 - isAbsYgreaterAbsX) + (PI_2 - poly) * isAbsYgreaterAbsX;
          yawRad = yawRad + (PI - 2 * yawRad) * (baseX < 0);
          yawRad = yawRad * (1 - ((baseY < 0) << 1));
        }

        let pitchRad;
        // atan2(dirY, sqrt(dirX^2 + dirZ^2)) -> pitchRad
        {
          const horizontalNormSquared = dirX * dirX + dirZ * dirZ;
          const isHorizontalNormZero = +(horizontalNormSquared === 0);
          const useHalfFactor = +(horizontalNormSquared >= 2);
          const useDoubleFactor = +(horizontalNormSquared < 0.5);
          const scaleFactor = ((1 - useHalfFactor) + 0.5 * useHalfFactor) * ((1 - useDoubleFactor) + 2 * useDoubleFactor);
          const scaledInvSqrtInput = horizontalNormSquared * scaleFactor * scaleFactor + isHorizontalNormZero;
          const deviation = scaledInvSqrtInput - 1;
          let invSqrt = 1 - 0.5 * deviation + 0.375 * deviation * deviation;
          invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
          invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
          const horizontalNorm = horizontalNormSquared * (scaleFactor * invSqrt) * (1 - isHorizontalNormZero);

          baseX = horizontalNorm;
          baseY = dirY;

          absX = baseX * ((baseX > 0) - (baseX < 0));
          absY = baseY * ((baseY > 0) - (baseY < 0));

          isAbsYgreaterAbsX = +(absY > absX);
          maxAbs = absX + (absY - absX) * isAbsYgreaterAbsX;
          minAbs = absY + (absX - absY) * isAbsYgreaterAbsX;
          ratio = minAbs / (maxAbs + (maxAbs === 0));
          ratio2 = ratio * ratio;

          poly = this.ATAN_P7;
          poly = poly * ratio2 + this.ATAN_P5;
          poly = poly * ratio2 + this.ATAN_P3;
          poly = (poly * ratio2 + 1) * ratio;

          pitchRad = poly * (1 - isAbsYgreaterAbsX) + (PI_2 - poly) * isAbsYgreaterAbsX;
          pitchRad = pitchRad + (PI - 2 * pitchRad) * +(baseX < 0);
          pitchRad = pitchRad * (1 - ((baseY < 0) << 1));
        }

        const cache = BR.cache;
        cache[5] = yawRad;
        cache[6] = pitchRad;

        this.direction = null;
      },

      // [dirX, dirY, dirZ] -> [yawDeg, pitchDeg]
      get 5() {
        const dirX = this.direction[5];
        const dirY = this.direction[6];
        const dirZ = this.direction[7];

        const PI_2 = this.PI_2_HI + this.PI_2_LO;
        const PI = PI_2 + PI_2;

        let baseX,
            baseY,
            absX,
            absY,
            isAbsYgreaterAbsX,
            maxAbs,
            minAbs,
            ratio,
            ratio2,
            poly;

        let yawRad;
        // atan2(dirX, dirZ) -> yawRad
        {
          baseX = dirZ;
          baseY = dirX;

          absX = baseX * ((baseX > 0) - (baseX < 0));
          absY = baseY * ((baseY > 0) - (baseY < 0));

          isAbsYgreaterAbsX = +(absY > absX);
          maxAbs = absX + (absY - absX) * isAbsYgreaterAbsX;
          minAbs = absY + (absX - absY) * isAbsYgreaterAbsX;
          ratio = minAbs / (maxAbs + (maxAbs === 0));
          ratio2 = ratio * ratio;

          poly = this.ATAN_P7;
          poly = poly * ratio2 + this.ATAN_P5;
          poly = poly * ratio2 + this.ATAN_P3;
          poly = (poly * ratio2 + 1) * ratio;

          yawRad = poly * (1 - isAbsYgreaterAbsX) + (PI_2 - poly) * isAbsYgreaterAbsX;
          yawRad = yawRad + (PI - 2 * yawRad) * (baseX < 0);
          yawRad = yawRad * (1 - ((baseY < 0) << 1));
        }

        let pitchRad;
        // atan2(dirY, sqrt(dirX^2 + dirZ^2)) -> pitchRad
        {
          const horizontalNormSquared = dirX * dirX + dirZ * dirZ;
          const isHorizontalNormZero = +(horizontalNormSquared === 0);
          const useHalfFactor = +(horizontalNormSquared >= 2);
          const useDoubleFactor = +(horizontalNormSquared < 0.5);
          const scaleFactor = ((1 - useHalfFactor) + 0.5 * useHalfFactor) * ((1 - useDoubleFactor) + 2 * useDoubleFactor);
          const scaledInvSqrtInput = horizontalNormSquared * scaleFactor * scaleFactor + isHorizontalNormZero;
          const deviation = scaledInvSqrtInput - 1;
          let invSqrt = 1 - 0.5 * deviation + 0.375 * deviation * deviation;
          invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
          invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
          const horizontalNorm = horizontalNormSquared * (scaleFactor * invSqrt) * (1 - isHorizontalNormZero);

          baseX = horizontalNorm;
          baseY = dirY;

          absX = baseX * ((baseX > 0) - (baseX < 0));
          absY = baseY * ((baseY > 0) - (baseY < 0));

          isAbsYgreaterAbsX = +(absY > absX);
          maxAbs = absX + (absY - absX) * isAbsYgreaterAbsX;
          minAbs = absY + (absX - absY) * isAbsYgreaterAbsX;
          ratio = minAbs / (maxAbs + (maxAbs === 0));
          ratio2 = ratio * ratio;

          poly = this.ATAN_P7;
          poly = poly * ratio2 + this.ATAN_P5;
          poly = poly * ratio2 + this.ATAN_P3;
          poly = (poly * ratio2 + 1) * ratio;

          pitchRad = poly * (1 - isAbsYgreaterAbsX) + (PI_2 - poly) * isAbsYgreaterAbsX;
          pitchRad = pitchRad + (PI - 2 * pitchRad) * +(baseX < 0);
          pitchRad = pitchRad * (1 - ((baseY < 0) << 1));
        }

        const cache = BR.cache;
        cache[5] = yawRad * this.RAD_TO_DEG;
        cache[6] = pitchRad * this.RAD_TO_DEG;

        this.direction = null;
      },

      // [yawRad, pitchRad] -> [yawDeg, pitchDeg]
      get 6() {
        const yawRad = this.direction[0];
        const pitchRad = this.direction[1];

        const cache = BR.cache;
        cache[5] = yawRad * this.RAD_TO_DEG;
        cache[6] = pitchRad * this.RAD_TO_DEG;

        this.direction = null;
      },

      // [yawDeg, pitchDeg] -> [yawRad, pitchRad]
      get 7() {
        const yawDeg = this.direction[0];
        const pitchDeg = this.direction[1];

        const cache = BR.cache;
        cache[5] = yawDeg * this.DEG_TO_RAD;
        cache[6] = pitchDeg * this.DEG_TO_RAD;

        this.direction = null;
      },

      // normalizer
      get 8() {
        const cache = BR.cache;
        const dirVecNormSquared = cache[5] * cache[5] + cache[6] * cache[6] + cache[7] * cache[7];
        const isVecNormZero = +(dirVecNormSquared === 0);
        const useHalfFactor = +(dirVecNormSquared >= 2);
        const useDoubleFactor = +(dirVecNormSquared < 0.5);
        const scaleFactor = ((1 - useHalfFactor) + 0.5 * useHalfFactor) * ((1 - useDoubleFactor) + 2 * useDoubleFactor);
        const scaledInvSqrtInput = dirVecNormSquared * scaleFactor * scaleFactor + isVecNormZero;
        const deviation = scaledInvSqrtInput - 1;
        let invSqrt = 1 - 0.5 * deviation + 0.375 * deviation * deviation;
        invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
        invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
        const dirInvVecNorm = scaleFactor * invSqrt * (1 - isVecNormZero);
        cache[5] *= dirInvVecNorm;
        cache[6] *= dirInvVecNorm;
        cache[7] *= dirInvVecNorm;
      },
    },

    idempotence: {
      state: 0,
      result: null,

      input: {
        dirX: null,
        dirY: null,
        dirZ: null,
        cell: null,
        maxDist: null,
        dirVecNormSquared: null,
        dirInvVecNorm: null,
        startOffsetDistance: null,
        startX: null,
        startY: null,
        startZ: null,
      },

      layout: {
        dirX: null,
        dirY: null,
        dirZ: null,
        startX: null,  // (includes start offset)
        startY: null,  // (includes start offset)
        startZ: null,  // (includes start offset)
        voxelX: null,
        voxelY: null,
        voxelZ: null,
        stepXSign: null,
        stepYSign: null,
        stepZSign: null,
        timeStrideX: null,
        timeStrideY: null,
        timeStrideZ: null,
        timeNextX: null,
        timeNextY: null,
        timeNextZ: null,
        dirVecNormSquared: null,
        dirInvVecNorm: null,
        startOffsetDistance: null,
        maxTime: null,
      },

      get 0() {
        const cache = BR.cache;
        const input = this.input;
        const layout = this.layout;

        const dirX = layout.dirX = input.dirX;
        const dirY = layout.dirY = input.dirY;
        const dirZ = layout.dirZ = input.dirZ;

        const cell = input.cell;

        const startX = layout.startX = input.startX;
        const startY = layout.startY = input.startY;
        const startZ = layout.startZ = input.startZ;

        const stepXSign = layout.stepXSign = (dirX > 0) - (dirX < 0);
        const stepYSign = layout.stepYSign = (dirY > 0) - (dirY < 0);
        const stepZSign = layout.stepZSign = (dirZ > 0) - (dirZ < 0);

        const absDirX = dirX * stepXSign;
        const absDirY = dirY * stepYSign;
        const absDirZ = dirZ * stepZSign;

        const isZeroDirX = +(absDirX === 0);
        const isZeroDirY = +(absDirY === 0);
        const isZeroDirZ = +(absDirZ === 0);

        layout.timeStrideX = cell / (absDirX + isZeroDirX);
        layout.timeStrideY = cell / (absDirY + isZeroDirY);
        layout.timeStrideZ = cell / (absDirZ + isZeroDirZ);

        const startCellX = startX / cell;
        layout.voxelX = (startCellX | 0) - ((startCellX | 0) > startCellX);
        const startCellY = startY / cell;
        layout.voxelY = (startCellY | 0) - ((startCellY | 0) > startCellY);
        const startCellZ = startZ / cell;
        layout.voxelZ = (startCellZ | 0) - ((startCellZ | 0) > startCellZ);

        let timeNextX = (((layout.voxelX + ((stepXSign + 1) >>> 1)) * cell - startX) * stepXSign) / (absDirX + isZeroDirX) + isZeroDirX * BR.INFINITY;
        let timeNextY = (((layout.voxelY + ((stepYSign + 1) >>> 1)) * cell - startY) * stepYSign) / (absDirY + isZeroDirY) + isZeroDirY * BR.INFINITY;
        let timeNextZ = (((layout.voxelZ + ((stepZSign + 1) >>> 1)) * cell - startZ) * stepZSign) / (absDirZ + isZeroDirZ) + isZeroDirZ * BR.INFINITY;

        cache[2] = absDirX;
        cache[0] = absDirY;
        cache[2] = cache[+(absDirX > absDirY) << 1];
        cache[0] = absDirZ;
        const maxAbsDir = cache[+(cache[2] > absDirZ) << 1];

        const timeEpsilon = cell / (maxAbsDir + (maxAbsDir === 0)) * 1e-9;
        layout.timeNextX = timeNextX += (timeNextX === 0) * timeEpsilon;
        layout.timeNextY = timeNextY += (timeNextY === 0) * timeEpsilon;
        layout.timeNextZ = timeNextZ += (timeNextZ === 0) * timeEpsilon;

        layout.dirVecNormSquared = input.dirVecNormSquared;
        layout.dirInvVecNorm = input.dirInvVecNorm;
        layout.startOffsetDistance = input.startOffsetDistance;
        layout.maxTime = input.maxDist * layout.dirInvVecNorm + timeEpsilon;

        this.state = 1;
        this[this.state];
      },

      get 1() {
        const layout = this.layout;

        const stepXSign = layout.stepXSign,
              stepYSign = layout.stepYSign,
              stepZSign = layout.stepZSign,
              timeStrideX = layout.timeStrideX,
              timeStrideY = layout.timeStrideY,
              timeStrideZ = layout.timeStrideZ,
              maxTime = layout.maxTime;

        let voxelX = layout.voxelX,
            voxelY = layout.voxelY,
            voxelZ = layout.voxelZ,
            timeNextX = layout.timeNextX,
            timeNextY = layout.timeNextY,
            timeNextZ = layout.timeNextZ;

        let pickX,
            pickY,
            pickZ,
            timeHit,
            blockId,
            isWithin;
        while (true) {
          layout.voxelX = voxelX;
          layout.voxelY = voxelY;
          layout.voxelZ = voxelZ;
          layout.timeNextX = timeNextX;
          layout.timeNextY = timeNextY;
          layout.timeNextZ = timeNextZ;

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

        const timeHitSafe = timeHit * (1 - (layout.dirVecNormSquared === 0));
        const offsetDistance = timeHitSafe * layout.dirVecNormSquared * layout.dirInvVecNorm;

        const cache = BR.cache;
        cache[0] = null;
        cache[9] = {
          blockId,
          position: [voxelX, voxelY, voxelZ],
          normal: [normalX, normalY, normalZ],
          adjacent: [voxelX + normalX, voxelY + normalY, voxelZ + normalZ],
          point: [layout.startX + layout.dirX * timeHitSafe, layout.startY + layout.dirY * timeHitSafe, layout.startZ + layout.dirZ * timeHitSafe],
          distance: offsetDistance + layout.startOffsetDistance,
          offsetDistance,
        };
        this.result = cache[(!!blockId & isWithin) * 9];
        cache[9] = null;

        this.state = 0;
      },
    },
  },

  iget(startPosition, direction, directionType, maxDistance, startOffset, cellSize, isIdempotent) {
    const cache = BR.cache;
    const converter = BR.dispatcher.converter;
    const idempotence = BR.dispatcher.idempotence;

    const input = idempotence.input;

    cache[5] = direction[0];
    cache[6] = direction[1];
    cache[7] = direction[2];
    converter.direction = direction;
    const dirType = cache[0] = directionType | 0;
    converter[cache[(dirType < 1) | (dirType > 3)]];
    const dirX = input.dirX = cache[5];
    const dirY = input.dirY = cache[6];
    const dirZ = input.dirZ = cache[7];

    cache[0] = cellSize | 0;
    input.cell = cache[+((cellSize | 0) <= 0) * 3];

    cache[0] = maxDistance;
    input.maxDist = cache[(maxDistance <= 0) << 2];

    const dirVecNormSquared = input.dirVecNormSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
    const isVecNormZero = +(dirVecNormSquared === 0);
    const useHalfFactor = +(dirVecNormSquared >= 2);
    const useDoubleFactor = +(dirVecNormSquared < 0.5);
    const scaleFactor = ((1 - useHalfFactor) + 0.5 * useHalfFactor) * ((1 - useDoubleFactor) + 2 * useDoubleFactor);
    const scaledInvSqrtInput = dirVecNormSquared * scaleFactor * scaleFactor + isVecNormZero;
    const deviation = scaledInvSqrtInput - 1;
    let invSqrt = 1 - 0.5 * deviation + 0.375 * deviation * deviation;
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    input.dirInvVecNorm = scaleFactor * invSqrt * (1 - isVecNormZero);

    cache[0] = startOffset;
    input.startOffsetDistance = cache[((startOffset === undefined) | (startOffset === null)) << 3];
    const startOffsetTime = input.startOffsetDistance * input.dirInvVecNorm;

    input.startX = startPosition[0] + dirX * startOffsetTime;
    input.startY = startPosition[1] + dirY * startOffsetTime;
    input.startZ = startPosition[2] + dirZ * startOffsetTime;

    idempotence[idempotence.state * +(isIdempotent !== false)];

    const result = idempotence.result;
    idempotence.result = null;
    return result;
  },

  get(startPosition, direction, directionType, maxDistance, startOffset, cellSize) {
    const cache = BR.cache;
    const converter = BR.dispatcher.converter;

    cache[5] = direction[0];
    cache[6] = direction[1];
    cache[7] = direction[2];
    converter.direction = direction;
    const dirType = cache[0] = directionType | 0;
    converter[cache[(dirType < 1) | (dirType > 3)]];
    const dirX = cache[5];
    const dirY = cache[6];
    const dirZ = cache[7];

    cache[0] = cellSize | 0;
    const cell = cache[+((cellSize | 0) <= 0) * 3];

    cache[0] = maxDistance;
    const maxDist = cache[(maxDistance <= 0) << 2];

    const dirVecNormSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
    const isVecNormZero = +(dirVecNormSquared === 0);
    const useHalfFactor = +(dirVecNormSquared >= 2);
    const useDoubleFactor = +(dirVecNormSquared < 0.5);
    const scaleFactor = ((1 - useHalfFactor) + 0.5 * useHalfFactor) * ((1 - useDoubleFactor) + 2 * useDoubleFactor);
    const scaledInvSqrtInput = dirVecNormSquared * scaleFactor * scaleFactor + isVecNormZero;
    const deviation = scaledInvSqrtInput - 1;
    let invSqrt = 1 - 0.5 * deviation + 0.375 * deviation * deviation;
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    const dirInvVecNorm = scaleFactor * invSqrt * (1 - isVecNormZero);

    cache[0] = startOffset;
    const startOffsetDistance = cache[((startOffset === undefined) | (startOffset === null)) << 3];
    const startOffsetTime = startOffsetDistance * dirInvVecNorm;

    const startX = startPosition[0] + dirX * startOffsetTime;
    const startY = startPosition[1] + dirY * startOffsetTime;
    const startZ = startPosition[2] + dirZ * startOffsetTime;

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

    const startCellX = startX / cell;
    let voxelX = (startCellX | 0) - ((startCellX | 0) > startCellX);
    const startCellY = startY / cell;
    let voxelY = (startCellY | 0) - ((startCellY | 0) > startCellY);
    const startCellZ = startZ / cell;
    let voxelZ = (startCellZ | 0) - ((startCellZ | 0) > startCellZ);

    let timeNextX = (((voxelX + ((stepXSign + 1) >>> 1)) * cell - startX) * stepXSign) / (absDirX + isZeroDirX) + isZeroDirX * BR.INFINITY;
    let timeNextY = (((voxelY + ((stepYSign + 1) >>> 1)) * cell - startY) * stepYSign) / (absDirY + isZeroDirY) + isZeroDirY * BR.INFINITY;
    let timeNextZ = (((voxelZ + ((stepZSign + 1) >>> 1)) * cell - startZ) * stepZSign) / (absDirZ + isZeroDirZ) + isZeroDirZ * BR.INFINITY;

    cache[2] = absDirX;
    cache[0] = absDirY;
    cache[2] = cache[+(absDirX > absDirY) << 1];
    cache[0] = absDirZ;
    const maxAbsDir = cache[+(cache[2] > absDirZ) << 1];

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

    const timeHitSafe = timeHit * (1 - isVecNormZero);
    const offsetDistance = timeHitSafe * dirVecNormSquared * dirInvVecNorm;

    cache[0] = null;
    cache[9] = {
      blockId,
      position: [voxelX, voxelY, voxelZ],
      normal: [normalX, normalY, normalZ],
      adjacent: [voxelX + normalX, voxelY + normalY, voxelZ + normalZ],
      point: [startX + dirX * timeHitSafe, startY + dirY * timeHitSafe, startZ + dirZ * timeHitSafe],
      distance: offsetDistance + startOffsetDistance,
      offsetDistance,
    };
    const result = cache[(!!blockId & isWithin) * 9];
    cache[9] = null;

    return result;
  },

  maxSteps(startPosition, direction, directionType, maxDistance, startOffset, cellSize) {
    const cache = BR.cache;
    const converter = BR.dispatcher.converter;

    cache[5] = direction[0];
    cache[6] = direction[1];
    cache[7] = direction[2];
    converter.direction = direction;
    const dirType = cache[0] = directionType | 0;
    converter[cache[(dirType < 1) | (dirType > 3)]];
    const dirX = cache[5];
    const dirY = cache[6];
    const dirZ = cache[7];

    cache[0] = cellSize | 0;
    const cell = cache[+((cellSize | 0) <= 0) * 3];

    cache[0] = maxDistance;
    const maxDist = cache[(maxDistance <= 0) << 2];

    const dirVecNormSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
    const isVecNormZero = +(dirVecNormSquared === 0);
    const useHalfFactor = +(dirVecNormSquared >= 2);
    const useDoubleFactor = +(dirVecNormSquared < 0.5);
    const scaleFactor = ((1 - useHalfFactor) + 0.5 * useHalfFactor) * ((1 - useDoubleFactor) + 2 * useDoubleFactor);
    const scaledInvSqrtInput = dirVecNormSquared * scaleFactor * scaleFactor + isVecNormZero;
    const deviation = scaledInvSqrtInput - 1;
    let invSqrt = 1 - 0.5 * deviation + 0.375 * deviation * deviation;
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    const dirInvVecNorm = scaleFactor * invSqrt * (1 - isVecNormZero);

    cache[0] = startOffset;
    const startOffsetDistance = cache[((startOffset === undefined) | (startOffset === null)) << 3];
    const startOffsetTime = startOffsetDistance * dirInvVecNorm;

    const startX = startPosition[0] + dirX * startOffsetTime;
    const startY = startPosition[1] + dirY * startOffsetTime;
    const startZ = startPosition[2] + dirZ * startOffsetTime;

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

    const startCellX = startX / cell;
    let voxelX = (startCellX | 0) - ((startCellX | 0) > startCellX);
    const startCellY = startY / cell;
    let voxelY = (startCellY | 0) - ((startCellY | 0) > startCellY);
    const startCellZ = startZ / cell;
    let voxelZ = (startCellZ | 0) - ((startCellZ | 0) > startCellZ);

    let timeNextX = (((voxelX + ((stepXSign + 1) >>> 1)) * cell - startX) * stepXSign) / (absDirX + isZeroDirX) + isZeroDirX * BR.INFINITY;
    let timeNextY = (((voxelY + ((stepYSign + 1) >>> 1)) * cell - startY) * stepYSign) / (absDirY + isZeroDirY) + isZeroDirY * BR.INFINITY;
    let timeNextZ = (((voxelZ + ((stepZSign + 1) >>> 1)) * cell - startZ) * stepZSign) / (absDirZ + isZeroDirZ) + isZeroDirZ * BR.INFINITY;

    cache[2] = absDirX;
    cache[0] = absDirY;
    cache[2] = cache[+(absDirX > absDirY) << 1];
    cache[0] = absDirZ;
    const maxAbsDir = cache[+(cache[2] > absDirZ) << 1];

    const timeEpsilon = cell / (maxAbsDir + (maxAbsDir === 0)) * 1e-9;
    timeNextX += (timeNextX === 0) * timeEpsilon;
    timeNextY += (timeNextY === 0) * timeEpsilon;
    timeNextZ += (timeNextZ === 0) * timeEpsilon;

    const maxTime = maxDist * dirInvVecNorm + timeEpsilon;

    let isFirstTimeWithinMax,
        axisSteps,
        lastTime,
        isLastTimeBeyondMax;

    let steps = 0;

    {
      isFirstTimeWithinMax = +(timeNextX <= maxTime);
      axisSteps = isFirstTimeWithinMax * ((((maxTime - timeNextX) / timeStrideX) | 0) + 1);
      lastTime = timeNextX + (axisSteps - isFirstTimeWithinMax) * timeStrideX;
      isLastTimeBeyondMax = +(lastTime > maxTime);
      axisSteps -= isLastTimeBeyondMax;
      lastTime -= (isLastTimeBeyondMax * timeStrideX);
      axisSteps += ((lastTime + timeStrideX) <= maxTime);
      axisSteps *= (absDirX !== 0);
      steps += axisSteps;
    }

    {
      isFirstTimeWithinMax = +(timeNextY <= maxTime);
      axisSteps = isFirstTimeWithinMax * ((((maxTime - timeNextY) / timeStrideY) | 0) + 1);
      lastTime = timeNextY + (axisSteps - isFirstTimeWithinMax) * timeStrideY;
      isLastTimeBeyondMax = +(lastTime > maxTime);
      axisSteps -= isLastTimeBeyondMax;
      lastTime -= (isLastTimeBeyondMax * timeStrideY);
      axisSteps += ((lastTime + timeStrideY) <= maxTime);
      axisSteps *= +(absDirY !== 0);
      steps += axisSteps;
    }

    {
      isFirstTimeWithinMax = +(timeNextZ <= maxTime);
      axisSteps = isFirstTimeWithinMax * ((((maxTime - timeNextZ) / timeStrideZ) | 0) + 1);
      lastTime = timeNextZ + (axisSteps - isFirstTimeWithinMax) * timeStrideZ;
      isLastTimeBeyondMax = +(lastTime > maxTime);
      axisSteps -= isLastTimeBeyondMax;
      lastTime -= (isLastTimeBeyondMax * timeStrideZ);
      axisSteps += ((lastTime + timeStrideZ) <= maxTime);
      axisSteps *= +(absDirZ !== 0);
      steps += axisSteps;
    }

    return steps;
  },

  startOffsetPosition(startPosition, direction, directionType, startOffset) {
    const cache = BR.cache;
    const converter = BR.dispatcher.converter;

    cache[5] = direction[0];
    cache[6] = direction[1];
    cache[7] = direction[2];
    converter.direction = direction;
    const dirType = cache[0] = directionType | 0;
    converter[cache[(dirType < 1) | (dirType > 3)]];
    const dirX = cache[5];
    const dirY = cache[6];
    const dirZ = cache[7];

    const dirVecNormSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
    const isVecNormZero = +(dirVecNormSquared === 0);
    const useHalfFactor = +(dirVecNormSquared >= 2);
    const useDoubleFactor = +(dirVecNormSquared < 0.5);
    const scaleFactor = ((1 - useHalfFactor) + 0.5 * useHalfFactor) * ((1 - useDoubleFactor) + 2 * useDoubleFactor);
    const scaledInvSqrtInput = dirVecNormSquared * scaleFactor * scaleFactor + isVecNormZero;
    const deviation = scaledInvSqrtInput - 1;
    let invSqrt = 1 - 0.5 * deviation + 0.375 * deviation * deviation;
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    const dirInvVecNorm = scaleFactor * invSqrt * (1 - isVecNormZero);

    cache[0] = startOffset;
    const startOffsetDistance = cache[((startOffset === undefined) | (startOffset === null)) << 3];
    const startOffsetTime = startOffsetDistance * dirInvVecNorm;

    return [
      startPosition[0] + dirX * startOffsetTime,
      startPosition[1] + dirY * startOffsetTime,
      startPosition[2] + dirZ * startOffsetTime,
    ];
  },

  maxDistancePosition(startPosition, direction, directionType, maxDistance, startOffset) {
    const cache = BR.cache;
    const converter = BR.dispatcher.converter;

    cache[5] = direction[0];
    cache[6] = direction[1];
    cache[7] = direction[2];
    converter.direction = direction;
    const dirType = cache[0] = directionType | 0;
    converter[cache[(dirType < 1) | (dirType > 3)]];
    const dirX = cache[5];
    const dirY = cache[6];
    const dirZ = cache[7];

    cache[0] = maxDistance;
    const maxDist = cache[(maxDistance <= 0) << 2];

    const dirVecNormSquared = dirX * dirX + dirY * dirY + dirZ * dirZ;
    const isVecNormZero = +(dirVecNormSquared === 0);
    const useHalfFactor = +(dirVecNormSquared >= 2);
    const useDoubleFactor = +(dirVecNormSquared < 0.5);
    const scaleFactor = ((1 - useHalfFactor) + 0.5 * useHalfFactor) * ((1 - useDoubleFactor) + 2 * useDoubleFactor);
    const scaledInvSqrtInput = dirVecNormSquared * scaleFactor * scaleFactor + isVecNormZero;
    const deviation = scaledInvSqrtInput - 1;
    let invSqrt = 1 - 0.5 * deviation + 0.375 * deviation * deviation;
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    invSqrt = invSqrt * (1.5 - 0.5 * scaledInvSqrtInput * invSqrt * invSqrt);
    const dirInvVecNorm = scaleFactor * invSqrt * (1 - isVecNormZero);

    cache[0] = startOffset;
    const startOffsetDistance = cache[((startOffset === undefined) | (startOffset === null)) << 3];

    const maxTime = (startOffsetDistance + maxDist) * dirInvVecNorm;

    return [
      startPosition[0] + dirX * maxTime,
      startPosition[1] + dirY * maxTime,
      startPosition[2] + dirZ * maxTime,
    ];
  },

  convertDirection(direction, fromType, toType) {
    const cache = BR.cache;
    const converter = BR.dispatcher.converter;

    cache[5] = direction[0];
    cache[6] = direction[1];
    cache[7] = direction[2];
    converter.direction = direction;

    let fromDirType = cache[0] = fromType | 0;
    fromDirType = cache[(fromDirType < 1) | (fromDirType > 3)];
    let toDirType = cache[0] = toType | 0;
    toDirType = cache[(toDirType < 1) | (toDirType > 3)];

    converter[(fromDirType !== toDirType) * (fromDirType + (fromDirType === 1) * (toDirType + 1) + 4 * ((fromDirType ^ toDirType) === 1))];
    converter[((fromDirType === 1) & (toDirType === 1)) << 3];

    cache[0] = [cache[5], cache[6]];
    cache[9] = [cache[5], cache[6], cache[7]];
    const result = cache[(toDirType === 1) * 9];
    cache[0] = cache[9] = null;

    return result;
  },
};

{
  const BRdefault = BR.default;
  const BRcache = BR.cache;
  Object.defineProperty(BRdefault, "directionType", {
    configurable: true,
    get: () => {
      return BRcache[1];
    },
    set: (value) => {
      BRcache[1] = value;
    },
  });
  Object.defineProperty(BRdefault, "maxDistance", {
    configurable: true,
    get: () => {
      return BRcache[4];
    },
    set: (value) => {
      BRcache[4] = value;
    },
  });
  Object.defineProperty(BRdefault, "startOffset", {
    configurable: true,
    get: () => {
      return BRcache[8];
    },
    set: (value) => {
      BRcache[8] = value;
    },
  });
  Object.defineProperty(BRdefault, "cellSize", {
    configurable: true,
    get: () => {
      return BRcache[3];
    },
    set: (value) => {
      BRcache[3] = value;
    },
  });
}

Object.seal(BR);
globalThis.BlockRaycaster = BR;

void 0;
