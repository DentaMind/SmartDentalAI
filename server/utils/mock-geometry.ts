import * as THREE from 'three';

export const createMockGeometry = (): THREE.BufferGeometry => {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
  const indices = new Uint32Array([0, 1, 2, 0, 2, 3]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  return geometry;
}; 