import axios from 'axios';
import { 
  Implant, 
  NerveTrace, 
  SurgicalGuideSettings, 
  GuideAnalysis, 
  GuideValidation, 
  NerveHeatmap 
} from '../../server/types/surgical-guide';
import * as THREE from 'three';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class SurgicalGuideService {
  private static instance: SurgicalGuideService;

  private constructor() {}

  public static getInstance(): SurgicalGuideService {
    if (!SurgicalGuideService.instance) {
      SurgicalGuideService.instance = new SurgicalGuideService();
    }
    return SurgicalGuideService.instance;
  }

  // Convert THREE.BufferGeometry to JSON format
  private geometryToJson(geometry: THREE.BufferGeometry) {
    const position = geometry.getAttribute('position');
    const indices = geometry.getIndex();
    return {
      vertices: Array.from(position.array),
      indices: indices ? Array.from(indices.array) : []
    };
  }

  // Convert JSON format to THREE.BufferGeometry
  private jsonToGeometry(json: any): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(json.vertices, 3));
    geometry.setIndex(json.indices);
    return geometry;
  }

  public async analyzeGuide(
    implants: Implant[],
    tissueSurface: THREE.BufferGeometry,
    nerveTraces: NerveTrace[]
  ): Promise<GuideAnalysis> {
    const response = await axios.post(`${API_URL}/surgical-guide/analyze`, {
      implants,
      tissueSurface: this.geometryToJson(tissueSurface),
      nerveTraces
    });
    return response.data;
  }

  public async generateGuide(
    implants: Implant[],
    tissueSurface: THREE.BufferGeometry,
    settings: SurgicalGuideSettings
  ): Promise<Blob> {
    const response = await axios.post(
      `${API_URL}/surgical-guide/generate`,
      {
        implants,
        tissueSurface: this.geometryToJson(tissueSurface),
        settings
      },
      { responseType: 'blob' }
    );
    return response.data;
  }

  public async validateGuide(
    guideGeometry: THREE.BufferGeometry,
    implants: Implant[],
    nerveTraces: NerveTrace[]
  ): Promise<GuideValidation> {
    const response = await axios.post(`${API_URL}/surgical-guide/validate`, {
      guideGeometry: this.geometryToJson(guideGeometry),
      implants,
      nerveTraces
    });
    return response.data;
  }

  public async generateNerveHeatmap(
    nerveTraces: NerveTrace[],
    dimensions: { width: number; height: number; depth: number }
  ): Promise<NerveHeatmap> {
    const response = await axios.post(`${API_URL}/surgical-guide/nerve-heatmap`, {
      nerveTraces,
      dimensions
    });
    return response.data;
  }
} 