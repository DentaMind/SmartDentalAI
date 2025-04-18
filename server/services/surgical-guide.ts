import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import * as THREE from 'three';
import { csg } from 'three-csg';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface Implant {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  diameter: number;
  length: number;
  system: string;
  type: string;
  sleeveHeight: number;
  sleeveOffset: number;
}

interface SurgicalGuideSettings {
  shellThickness: number;
  offset: number;
  sleeveDiameter: number;
  drillClearance: number;
  ventilationHoles: boolean;
  holeSpacing: number;
  holeDiameter: number;
}

interface NerveTrace {
  points: [number, number, number][];
  radius: number;
}

export class SurgicalGuideService {
  private async loadSTL(filePath: string): Promise<THREE.BufferGeometry> {
    const loader = new THREE.STLLoader();
    const buffer = await fs.readFile(filePath);
    return loader.parse(buffer);
  }

  private createGuideBase(
    tissueSurface: THREE.BufferGeometry,
    settings: SurgicalGuideSettings
  ): THREE.Mesh {
    // Create a slightly larger version of the tissue surface for the outer shell
    const outerShell = tissueSurface.clone();
    outerShell.scale(1 + settings.offset, 1 + settings.offset, 1 + settings.offset);

    // Create the guide base using CSG operations
    const baseMesh = new THREE.Mesh(outerShell);
    const tissueMesh = new THREE.Mesh(tissueSurface);

    // Subtract the tissue surface from the outer shell
    const guideBase = csg.subtract(baseMesh, tissueMesh);

    // Add thickness to the guide
    const thickness = settings.shellThickness;
    const extrudedGeometry = new THREE.ExtrudeGeometry(
      guideBase.geometry,
      {
        depth: thickness,
        bevelEnabled: false
      }
    );

    return new THREE.Mesh(extrudedGeometry);
  }

  private createSleeve(
    implant: Implant,
    settings: SurgicalGuideSettings
  ): THREE.Mesh {
    const sleeveGeometry = new THREE.CylinderGeometry(
      implant.diameter / 2 + settings.sleeveOffset,
      implant.diameter / 2 + settings.sleeveOffset,
      implant.sleeveHeight,
      32
    );

    const sleeve = new THREE.Mesh(sleeveGeometry);
    sleeve.position.set(...implant.position);
    sleeve.rotation.set(...implant.rotation);

    return sleeve;
  }

  private addVentilationHoles(
    guide: THREE.Mesh,
    settings: SurgicalGuideSettings
  ): THREE.Mesh {
    if (!settings.ventilationHoles) return guide;

    const holes: THREE.Mesh[] = [];
    const spacing = settings.holeSpacing;
    const diameter = settings.holeDiameter;

    // Create a grid of holes
    for (let x = -guide.geometry.boundingBox.max.x; x <= guide.geometry.boundingBox.max.x; x += spacing) {
      for (let y = -guide.geometry.boundingBox.max.y; y <= guide.geometry.boundingBox.max.y; y += spacing) {
        const holeGeometry = new THREE.CylinderGeometry(
          diameter / 2,
          diameter / 2,
          settings.shellThickness * 2,
          16
        );
        const hole = new THREE.Mesh(holeGeometry);
        hole.position.set(x, y, 0);
        holes.push(hole);
      }
    }

    // Subtract holes from guide
    let result = guide;
    for (const hole of holes) {
      result = csg.subtract(result, hole);
    }

    return result;
  }

  public async generateGuide(
    implants: Implant[],
    tissueSurfacePath: string,
    settings: SurgicalGuideSettings,
    nerveTrace?: NerveTrace
  ): Promise<string> {
    try {
      // Load the tissue surface
      const tissueSurface = await this.loadSTL(tissueSurfacePath);

      // Create the guide base
      const guideBase = this.createGuideBase(tissueSurface, settings);

      // Add sleeves for each implant
      const sleeves = implants.map(implant => this.createSleeve(implant, settings));

      // Combine all components
      let guide = guideBase;
      for (const sleeve of sleeves) {
        guide = csg.union(guide, sleeve);
      }

      // Add ventilation holes if enabled
      guide = this.addVentilationHoles(guide, settings);

      // Export as STL
      const exporter = new STLExporter();
      const stlString = exporter.parse(guide);

      // Save the STL file
      const outputPath = path.join(
        process.env.UPLOAD_DIR || 'uploads',
        'surgical-guides',
        `${uuidv4()}.stl`
      );

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, stlString);

      return outputPath;
    } catch (error) {
      console.error('Error generating surgical guide:', error);
      throw new Error('Failed to generate surgical guide');
    }
  }
} 