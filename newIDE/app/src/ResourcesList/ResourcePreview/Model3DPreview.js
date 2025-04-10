// @flow
import React from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import GDevelopThemeContext from '../../UI/Theme/GDevelopThemeContext';

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    flex: 1,
    minHeight: 0,
    height: '100%',
    width: '100%',
  },
  canvas: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'url("res/transparentback.png") repeat',
  },
};

type Props = {|
  modelUrl: string,
|};

const Model3DPreview = ({ modelUrl }: Props) => {
  const containerRef = React.useRef();
  const theme = React.useContext(GDevelopThemeContext);

  React.useEffect(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(2, 2, 4);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true, // Alpha allows seeing the checkered background
      });

      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      // Tone mapping for better color rendering
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1);
      scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 3);
      hemiLight.position.set(0, 20, 0);
      scene.add(hemiLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 3);
      mainLight.position.set(5, 10, 7.5);
      scene.add(mainLight);

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        gltf => {
          const model = gltf.scene;

          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          model.scale.set(scale, scale, scale);
          model.position.sub(center);

          scene.add(model);

          camera.lookAt(new THREE.Vector3(0, 0, 0));

          renderer.render(scene, camera);
        },
        undefined,
        error => {
          console.error('Error loading model:', error);
        }
      );

      return () => {
        renderer.dispose();
        if (container) container.removeChild(renderer.domElement);
      };
    },
    [modelUrl]
  );

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.background,
          filter: theme.imagePreview.backgroundFilter || 'none',
        }}
      />
      <div ref={containerRef} style={styles.canvas} />
    </div>
  );
};

export default Model3DPreview;
