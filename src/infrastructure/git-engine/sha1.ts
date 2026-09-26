const rotateLeft = (value: number, bits: number) =>
  ((value << bits) | (value >>> (32 - bits))) >>> 0;

/** Plain SHA-1 (FIPS 180-4). Synchronous, unlike Web Crypto, so commands stay synchronous. */
export function sha1(bytes: Uint8Array): string {
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const message = new Uint8Array(paddedLength);
  message.set(bytes);
  message[bytes.length] = 0x80;

  const view = new DataView(message.buffer);
  const bitLength = bytes.length * 8;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 2 ** 32));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  const schedule = new DataView(new ArrayBuffer(80 * 4));

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      schedule.setUint32(index * 4, view.getUint32(offset + index * 4));
    }
    for (let index = 16; index < 80; index += 1) {
      const word = (position: number) => schedule.getUint32(position * 4);
      schedule.setUint32(
        index * 4,
        rotateLeft(word(index - 3) ^ word(index - 8) ^ word(index - 14) ^ word(index - 16), 1),
      );
    }

    let [a, b, c, d, e] = state as [number, number, number, number, number];
    for (let index = 0; index < 80; index += 1) {
      let mix: number;
      let constant: number;
      if (index < 20) {
        mix = (b & c) | (~b & d);
        constant = 0x5a827999;
      } else if (index < 40) {
        mix = b ^ c ^ d;
        constant = 0x6ed9eba1;
      } else if (index < 60) {
        mix = (b & c) | (b & d) | (c & d);
        constant = 0x8f1bbcdc;
      } else {
        mix = b ^ c ^ d;
        constant = 0xca62c1d6;
      }
      const next = (rotateLeft(a, 5) + mix + e + constant + schedule.getUint32(index * 4)) >>> 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = next;
    }

    [a, b, c, d, e].forEach((value, position) => {
      state[position] = ((state[position] ?? 0) + value) >>> 0;
    });
  }

  return state.map((value) => value.toString(16).padStart(8, '0')).join('');
}
