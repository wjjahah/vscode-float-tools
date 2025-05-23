function formatHex32(hexStr: string): string {
  hexStr = hexStr.replace(/^0x/, "");
  hexStr = hexStr.padStart(8, '0');
  return hexStr.toUpperCase();
}

function formatHex64(hexStr: string): string {
  hexStr = hexStr.replace(/^0x/, "");
  hexStr = hexStr.padStart(16, '0');
  return hexStr.toUpperCase();
}

// 单精度浮点数（32 位）转换为十六进制表示
function float32ToHex32(floatStr: string): string {
  const float = parseFloat(floatStr);
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, float, false); // Big-endian
  const intValue = view.getUint32(0, false);
  let hexString = intValue.toString(16);
  hexString = "0x" + formatHex32(hexString);
  return hexString;
}

// 双精度浮点数（64 位）转换为十六进制表示
function float64ToHex64(floatStr: string): string {
  const float = parseFloat(floatStr);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, float, false); // Big-endian
  const highBits = view.getUint32(0, false);
  const lowBits = view.getUint32(4, false);
  let highHex = highBits.toString(16);
  let lowHex = lowBits.toString(16);

  highHex = formatHex32(highHex);
  lowHex = formatHex32(lowHex);

  return "0x" + highHex + lowHex;
}

// 十六进制字符串转换为单精度浮点数（32 位）
function hex32ToFloat32(hex: string): string {
  if (!/^0x[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("Invalid hexadecimal string");
  }

  hex = formatHex32(hex);
  if (hex === "80000000") {
    return "-0.0";
  }
  const intValue = parseInt(hex, 16);
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setUint32(0, intValue, false);
  const floatValue = view.getFloat32(0, false);
  return floatValue.toString();
}

// 十六进制字符串转换为双精度浮点数（64 位）
function hex64ToFloat64(hex: string): string {
  if (!/^0x[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("Invalid hexadecimal string");
  }
  hex = formatHex64(hex);
  if (hex === "8000000000000000") {
    return "-0.0";
  }
  const highBits = parseInt(hex.slice(0, 8), 16);
  const lowBits = parseInt(hex.slice(8), 16);
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, highBits, false);
  view.setUint32(4, lowBits, false);
  const doubleValue = view.getFloat64(0, false);
  return doubleValue.toString();
}

// 十六进制字符串转换为十六进制浮点表示（如 0x1.2345678p+10）
function hex32ToHexFloat32(hexStr: string): string {
  let floatNum = parseFloat(hex32ToFloat32(hexStr));
  if (!isFinite(floatNum)) {
    return floatNum.toString(); // Handle NaN and Infinity directly
  }

  hexStr = formatHex32(hexStr);
  if (hexStr === "00000000") {
    return "0x0p+0";
  }
  if (hexStr === "80000000") {
    return "-0x0p+0";
  }

  const sign = floatNum < 0 ? "-" : "";
  floatNum = Math.abs(floatNum);
  let exponent = 0;
  let mantissa = floatNum;
  while (mantissa >= 2.0) {
    mantissa /= 2.0;
    exponent++;
  }
  while (mantissa < 1.0) {
    mantissa *= 2.0;
    exponent--;
  }
  let hexMantissa = (mantissa * Math.pow(2, 24))
    .toString(16)
    .replace(/0*$/, "");
  hexMantissa = hexMantissa.slice(1);
  return `${sign}0x1${hexMantissa === "" ? "" : "."}${hexMantissa}p${exponent >= 0 ? "+" : ""
    }${exponent}`;
}

// 十六进制字符串转换为十六进制浮点表示（如 0x1.2345678p+10）
function hex64ToHexFloat64(hexStr: string): string {
  const floatNum = parseFloat(hex64ToFloat64(hexStr));
  if (!isFinite(floatNum)) {
    return floatNum.toString(); // Handle NaN and Infinity directly
  }

  hexStr = formatHex64(hexStr);

  if (hexStr === "0000000000000000") {
    return "0x0p+0";
  }
  if (hexStr === "8000000000000000") {
    return "-0x0p+0";
  }

  const buffer = new ArrayBuffer(8);
  const float64View = new Float64Array(buffer);
  const uint8View = new Uint8Array(buffer);

  // Write float value into buffer
  float64View[0] = floatNum;

  // Extract sign, exponent, and mantissa
  const sign = uint8View[7] & 0x80 ? "-" : "";
  let exponent = ((uint8View[7] & 0x7f) << 4) | (uint8View[6] >> 4);
  let mantissa = hexStr.slice(3, 16).toLowerCase();
  mantissa = mantissa.replace(/0*$/, "");
  mantissa = (mantissa === "" ? "" : ".") + mantissa;

  if (exponent === 0) {
    // Denormalized number, handle the hidden bit and adjust exponent
    mantissa = "0" + mantissa;
    exponent = -1022;
  } else {
    // Normalized number, include the hidden bit
    mantissa = "1" + mantissa;
    exponent -= 1023;
  }

  // Format the result
  return `${sign}0x${mantissa}p${exponent >= 0 ? "+" : ""}${exponent}`;
}

function hexFloat32ToHex32(hexStr: string): string {
  const regex = /^([\+\-]?0x[0-9A-Fa-f]+(?:\.[0-9A-Fa-f]*)?)p([\+\-]?\d+)$/i;
  const match = hexStr.match(regex);

  if (!match) {
    return `Invalid hexadecimal floating-point string: ${hexStr}`;
  }

  const hexMantissa = match[1];
  const exponent = parseInt(match[2], 10);

  // 解析符号
  const sign = hexMantissa.startsWith("-") ? -1 : 1;
  const mantissa =
    hexMantissa.startsWith("-") || hexMantissa.startsWith("+")
      ? hexMantissa.slice(3) // 去掉 "0x" 和符号
      : hexMantissa.slice(2); // 去掉 "0x"

  // 将十六进制尾数转换为十进制表示
  const mantissaParts = mantissa.split(".");
  const intPart = parseInt(mantissaParts[0], 16);
  const fracPart =
    mantissaParts.length > 1 ? parseInt(mantissaParts[1], 16) : 0;

  // 计算尾数值
  let mantissaValue = intPart;
  if (mantissaParts.length > 1) {
    mantissaValue += fracPart / Math.pow(16, mantissaParts[1].length);
  }

  // 计算最终值
  const floatValue = sign * mantissaValue * Math.pow(2, exponent);

  // 将浮点数转换为纯十六进制数字
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, floatValue);
  let hexNumber = "";
  for (let i = 0; i < 4; i++) {
    let hexByte = view.getUint8(i).toString(16).padStart(2, "0");
    hexNumber += hexByte;
  }

  return "0x" + hexNumber;
}

function hexFloat64ToHex64(hexStr: string): string {
  const regex = /^([\+\-]?0x[0-9A-Fa-f]+(?:\.[0-9A-Fa-f]*)?)p([\+\-]?\d+)$/i;
  const match = hexStr.match(regex);

  if (!match) {
    return `Invalid hexadecimal floating-point string: ${hexStr}`;
  }

  const hexMantissa = match[1];
  const exponent = parseInt(match[2], 10);

  // 解析符号
  const sign = hexMantissa.startsWith("-") ? -1 : 1;
  const mantissa =
    hexMantissa.startsWith("-") || hexMantissa.startsWith("+")
      ? hexMantissa.slice(3) // 去掉 "0x" 和符号
      : hexMantissa.slice(2); // 去掉 "0x"

  // 将十六进制尾数转换为十进制表示
  const mantissaParts = mantissa.split(".");
  const intPart = parseInt(mantissaParts[0], 16);
  const fracPart =
    mantissaParts.length > 1 ? parseInt(mantissaParts[1], 16) : 0;

  // 计算尾数值
  let mantissaValue = intPart;
  if (mantissaParts.length > 1) {
    mantissaValue += fracPart / Math.pow(16, mantissaParts[1].length);
  }

  // 计算最终值
  const floatValue = sign * mantissaValue * Math.pow(2, exponent);

  // 将浮点数转换为纯十六进制数字
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, floatValue);
  let hexNumber = "";
  for (let i = 0; i < 8; i++) {
    let hexByte = view.getUint8(i).toString(16).padStart(2, "0");
    hexNumber += hexByte;
  }

  return "0x" + hexNumber;
}

// 十六进制浮点表示转换为浮点数
function hexFloat32ToFloat32(hex: string): string {
  if (hex.match(/^inf/i) || hex.match(/^nan/i)) {
    return hex;
  }
  const match = hex.match(/^([\+\-]?0x([0-1])(\.)?([0-9a-fA-F]*)?p([\+\-]?\d+))$/);
  // const match = hex.match(/^([\+\-]?0x[0-1]+(?:\.[0-9A-Fa-f]*)?)p([\+\-]?\d+)$/);
  if (!match) {
    throw new Error("Invalid hexadecimal floating-point string");
  }

  const sign = match[1][0] === "-" ? -1 : 1;
  const exponent = parseInt(match[5], 10);
  let mantissa = 0;
  if (match[4]) {
    const mantissaHex = match[4];

    for (let i = 0; i < mantissaHex.length; i++) {
      mantissa += parseInt(mantissaHex[i], 16) / Math.pow(16, i + 1);
    }
  }
  mantissa += parseInt(match[2], 10); // Add the implicit leading 1 in normalized form

  if (mantissa === 0 && sign === -1) {
    return "-0.0";
  }

  return (sign * mantissa * Math.pow(2, exponent)).toString();
}

// 十六进制浮点表示转换为浮点数
function hexFloat64ToFloat64(hex: string): string {
  return hexFloat32ToFloat32(hex);
}

function formartIntegerHex(value: bigint, nbyte: 4 | 8): string {
  if (value < 0n) {
    const bits = nbyte * 8;
    const mask = (1n << BigInt(bits)) - 1n;

    const complement = (~BigInt(-value) + 1n) & mask;
    // const complement = (~Math.abs(value) + 1) & mask;
    return complement.toString(16).padStart(nbyte, '0');
  }
  return value.toString(16);
}

function integerHexToInt(hexStr: string, nbyte: 4 | 8): string {
  const bitLength = nbyte * 8;
  let num = BigInt(hexStr);

  const isNegative = num >= (1n << BigInt(bitLength - 1));
  const maxValue = -(1n << BigInt(bitLength));

  if (isNegative) {
      num = num + maxValue;
      return BigInt(num).toString(10);
  }
  return BigInt(hexStr).toString(10);
}

type NumberType =
  | "hex"
  | "float"
  | "scientific float"
  | "integer"
  | "hex float"
  | "N/A";

function identifyNumberType(input: string): NumberType {
  // 正则表达式匹配整数
  const integerRegex = /^[\+\-]?\d+$/;

  // 正则表达式匹配十六进制数字
  const hexRegex = /^[\+\-]?(0[xX])?[0-9A-Fa-f]+$/;

  // 正则表达式匹配浮点数
  const floatRegex = /^[\+\-]?\d+(\.\d+)?[fF]?$/;

  // 正则表达式匹配科学计数法表示的浮点数
  const scientificFloatRegex = /^[\+\-]?\d+(\.\d+)?([eE][\+\-]?\d+)?[fF]?$/;

  // 正则表达式匹配十六进制浮点数
  const hexFloatRegex = /^[\+\-]?0[xX][0-9A-Fa-f]+(\.[0-9A-Fa-f]*)?p[\+\-]?\d+[fF]?$/;

  if (integerRegex.test(input)) {
    return "integer";
  } else if (hexRegex.test(input)) {
    return "hex";
  } else if (hexFloatRegex.test(input)) {
    return "hex float";
  } else if (scientificFloatRegex.test(input)) {
    return "scientific float";
  } else if (floatRegex.test(input)) {
    return "float";
  } else {
    return "N/A";
  }
}

function pasreNumber(input: string): any {
  let floathex32 = "N/A";
  let floathex64 = "N/A";
  let float32 = "N/A";
  let float64 = "N/A";
  let hexfloat32 = "N/A";
  let hexfloat64 = "N/A";

  let hex32 = "N/A";
  let hex64 = "N/A";
  let int32 = "N/A";
  let int64 = "N/A";
  let uint32 = "N/A";
  let uint64 = "N/A";

  const strtype = identifyNumberType(input);
  if (strtype === "hex") {
    // input = input.replace(/^\+/, "");
    input = input.replace(/^-/, "");
    input = input.replace(/^0x/, "");
    if (input.length < 8) {
      floathex32 = "0x" + formatHex32(input);
      floathex64 = "0x" + formatHex64(input);
      hex32 = floathex32;
      hex64 = floathex64;
    } else if (input.length === 8) {
      floathex32 = "0x" + formatHex32(input);
      hex32 = floathex32;
    } else if (input.length <= 16) {
      floathex64 = "0x" + formatHex64(input);
      hex64 = floathex64;
    }
  } else if (strtype === "float") {
    const float = parseFloat(input);
    if (float > 3.4028234663852886e38 || float < -3.4028234663852886e38) {
      floathex64 = float64ToHex64(input);
    } else {
      floathex32 = float32ToHex32(input);
      floathex64 = float64ToHex64(input);
    }
  } else if (strtype === "scientific float") {
    input = input.replace(/[fF]$/, "");
    const float = parseFloat(input);
    if (float > 3.4028234663852886e38 || float < -3.4028234663852886e38) {
      floathex64 = float64ToHex64(float.toString());
    } else {
      floathex32 = float32ToHex32(float.toString());
      floathex64 = float64ToHex64(float.toString());
    }
  } else if (strtype === "integer") {
    const float = parseFloat(input);
    if (float > 3.4028234663852886e38 || float < -3.4028234663852886e38) {
      floathex64 = float64ToHex64(float.toString());
    } else {
      floathex32 = float32ToHex32(float.toString());
      floathex64 = float64ToHex64(float.toString());
    }

    const integer = BigInt(input);
    console.log(`integer = (${integer})`);
    const integerHexLength = integer.toString(16).replace(/^-/, "").length;
    if (integerHexLength > 8) {
      hex64 = "0x" + formatHex64(formartIntegerHex(integer, 8));
    } else if(integerHexLength === 8){
      hex32 = "0x" + formatHex32(formartIntegerHex(integer, 4));
    } else {
      hex32 = "0x" + formatHex32(formartIntegerHex(integer, 4));
      hex64 = "0x" + formatHex64(formartIntegerHex(integer, 8));
    }
  } else if (strtype === "hex float") {
    input = input.replace(/[fF]$/, "");
    floathex32 = hexFloat32ToHex32(input);
    floathex64 = hexFloat64ToHex64(input);
  }


  if (floathex32 !== "N/A") {
    float32 = hex32ToFloat32(floathex32);
    hexfloat32 = hex32ToHexFloat32(floathex32);
  }
  if (floathex64 !== "N/A") {
    float64 = hex64ToFloat64(floathex64);
    hexfloat64 = hex64ToHexFloat64(floathex64);
  }
  if (hex32 !== "N/A") {
    int32 = integerHexToInt(hex32, 4);
    uint32 = BigInt(hex32).toString();
  }
  if (hex64 !== "N/A") {
    int64 = integerHexToInt(hex64, 8);
    uint64 = BigInt(hex64).toString();
  }

  let floatdata: any = {};
  let intdata: any = {};

  floatdata.floathex32 = floathex32;
  floatdata.floathex64 = floathex64;
  floatdata.float32 = float32;
  floatdata.float64 = float64;
  floatdata.hexfloat32 = hexfloat32;
  floatdata.hexfloat64 = hexfloat64;

  intdata.hex32 = hex32;
  intdata.hex64 = hex64;
  intdata.int32 = int32;
  intdata.int64 = int64;
  intdata.uint32 = uint32;
  intdata.uint64 = uint64;

  return { floatdata, intdata };
}

export function pasreNumberMarkdown(input: string): string {
  let { floatdata, intdata } = pasreNumber(input);

  let hoverMessage = "";

  let floathex32 = floatdata.floathex32;
  let floathex64 = floatdata.floathex64;
  let float32 = floatdata.float32;
  let float64 = floatdata.float64;
  let hexfloat32 = floatdata.hexfloat32;
  let hexfloat64 = floatdata.hexfloat64;

  let hex32 = intdata.hex32;
  let hex64 = intdata.hex64;
  let int32 = intdata.int32;
  let int64 = intdata.int64;
  let uint32 = intdata.uint32;
  let uint64 = intdata.uint64;

  if (floathex32 !== "N/A" || floathex64 !== "N/A") {
    hoverMessage = hoverMessage + "| dataType | formart | output |\n";
    hoverMessage = hoverMessage + "|:--------------|:--------------|--------------|\n";
    hoverMessage = hoverMessage + `| select | ${identifyNumberType(input)} | ${input} |` + "\n";
  }
  if (floathex32 !== "N/A") {
    hoverMessage = hoverMessage + `| float | %08x | ${floathex32} |` + "\n";
    hoverMessage = hoverMessage + `| float | %e | ${float32} |` + "\n";
    hoverMessage = hoverMessage + `| float | %a | ${hexfloat32} |` + "\n";
  }
  if (floathex64 !== "N/A") {
    hoverMessage = hoverMessage + `| double | %016llx | ${floathex64} |` + "\n";
    hoverMessage = hoverMessage + `| double | %e | ${float64} |` + "\n";
    hoverMessage = hoverMessage + `| double | %a | ${hexfloat64} |` + "\n";
  }
  if (hex32 !== "N/A") {
    hoverMessage = hoverMessage + `| int | %08x | ${hex32} |` + "\n";
    hoverMessage = hoverMessage + `| int | %d | ${int32} |` + "\n";
    hoverMessage = hoverMessage + `| int | %u | ${uint32} |` + "\n";
  }
  if (hex64 !== "N/A") {
    hoverMessage = hoverMessage + `| long | %016llx | ${hex64} |` + "\n";
    hoverMessage = hoverMessage + `| long | %lld | ${int64} |` + "\n";
    hoverMessage = hoverMessage + `| long | %llu | ${uint64} |` + "\n";
  }
  return hoverMessage;
}

export function pasreNumberWebview(input: string): string {
  let { floatdata, intdata } = pasreNumber(input);

  let floathex32 = floatdata.floathex32;
  let floathex64 = floatdata.floathex64;
  let float32 = floatdata.float32;
  let float64 = floatdata.float64;
  let hexfloat32 = floatdata.hexfloat32;
  let hexfloat64 = floatdata.hexfloat64;

  let hex32 = intdata.hex32;
  let hex64 = intdata.hex64;
  let int32 = intdata.int32;
  let int64 = intdata.int64;

  return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>float-tools-webview</title>
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #929692;
                    color: cyan;
                }
                #suggestion {
                    padding: 10px;
                    background-color: #ffecb3;
                    border: 1px solid #ffd700;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <h2>Select Number All Formart Table</h2>
            <table>
                <tr>
                    <th>reinterpret</th>
                    <th>dataType</th>
                    <th>formart</th>
                    <th>output</th>
                </tr>
                <tr>
                    <td rowspan="6">As float</td>
                    <td rowspan="3">float</td>
                    <td>%08x</td>
                    <td>${floathex32}</td>
                </tr>
                <tr>
                    <td>%e</td>
                    <td>${float32}</td>
                </tr>
                <tr>
                    <td>%a</td>
                    <td>${hexfloat32}</td>
                </tr>
                <tr>
                    <td rowspan="3">double</td>
                    <td>%016llx</td>
                    <td>${floathex64}</td>
                </tr>
                <tr>
                    <td>%e</td>
                    <td>${float64}</td>
                </tr>
                <tr>
                    <td>%a</td>
                    <td>${hexfloat64}</td>
                </tr>
                <tr>
                    <td rowspan="6">As integer</td>
                    <td rowspan="2">int</td>
                    <td>%08x</td>
                    <td>${hex32}</td>
                </tr>
                <tr>
                    <td>%d</td>
                    <td>${int32}</td>
                </tr>
                <tr>
                    <td rowspan="2">long</td>
                    <td>%016llx</td>
                    <td>${hex64}</td>
                </tr>
                <tr>
                    <td>%ld</td>
                    <td>${int64}</td>
                </tr>
            </table>
        </body>
        </html>
    `;
}
