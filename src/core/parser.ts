/**
 * @file: parser.ts
 * @description: Core parsing functions for PPTX data (pure functions, no DOM dependencies)
 * @dependencies: types.ts
 * @created: 2024-12-19
 */

import { 
  PPTXData, 
  Slide, 
  MasterSlide, 
  Theme, 
  MediaFile, 
  PresentationInfo,
  ParseResult 
} from '../shared/types'

// Core parsing functions (pure, no DOM dependencies)
export class CoreParser {
  
  // Parse presentation metadata from XML object
  static parsePresentation(xmlData: any): PresentationInfo {
    const presentation = xmlData.presentation || {}
    const sldIdLst = presentation.sldIdLst || {}
    const sldMasterIdLst = presentation.sldMasterIdLst || {}
    const themeIdLst = presentation.themeIdLst || {}
    const sldSz = presentation.sldSz || {}
    
    return {
      slideCount: Array.isArray(sldIdLst.sldId) ? sldIdLst.sldId.length : 0,
      masterCount: Array.isArray(sldMasterIdLst.sldMasterId) ? sldMasterIdLst.sldMasterId.length : 0,
      themeCount: Array.isArray(themeIdLst.themeId) ? themeIdLst.themeId.length : 0,
      slideSize: {
        width: parseInt(sldSz['@attributes']?.cx || '9144000'),
        height: parseInt(sldSz['@attributes']?.cy || '6858000')
      }
    }
  }

  // Parse slide data from XML object
  static parseSlide(xmlData: any, slideNumber: number): Slide {
    const slide = xmlData['p:sld'] || xmlData.sld || {}
    const spTree = slide['p:spTree'] || slide.spTree || {}
    const shapes = spTree['p:sp'] || spTree.sp || []
    
    return {
      id: `slide-${slideNumber}`,
      name: `Slide ${slideNumber}`,
      number: slideNumber,
      elements: this.parseShapes(shapes),
      background: this.parseBackground(slide),
      layout: this.parseLayout(slide)
    }
  }

  // Parse master slide data
  static parseMasterSlide(xmlData: any, masterNumber: number): MasterSlide {
    const master = xmlData['p:sldMaster'] || xmlData.sldMaster || {}
    const spTree = master['p:spTree'] || master.spTree || {}
    const shapes = spTree['p:sp'] || spTree.sp || []
    
    return {
      id: `master-${masterNumber}`,
      name: `Master ${masterNumber}`,
      number: masterNumber,
      elements: this.parseShapes(shapes),
      layouts: this.parseLayouts(master)
    }
  }

  // Parse theme data
  static parseTheme(xmlData: any, themeNumber: number): Theme {
    const theme = xmlData['a:theme'] || xmlData.theme || {}
    const themeElements = theme['a:themeElements'] || theme.themeElements || {}
    
    return {
      id: `theme-${themeNumber}`,
      name: `Theme ${themeNumber}`,
      number: themeNumber,
      colors: this.parseColorScheme(themeElements),
      fonts: this.parseFontScheme(themeElements)
    }
  }

  // Parse shapes from XML
  private static parseShapes(shapes: any[]): any[] {
    if (!Array.isArray(shapes)) return []
    
    return shapes.map((shape, index) => ({
      id: `shape-${index}`,
      type: this.getShapeType(shape),
      position: this.parsePosition(shape),
      size: this.parseSize(shape),
      text: this.parseText(shape),
      style: this.parseStyle(shape)
    }))
  }

  // Parse background
  private static parseBackground(slide: any): any {
    const bg = slide['p:bg'] || slide.bg || {}
    const bgPr = bg['p:bgPr'] || bg.bgPr || {}
    
    return {
      type: bgPr['a:solidFill'] ? 'solid' : 'none',
      color: this.parseColor(bgPr['a:solidFill'] || bgPr.solidFill)
    }
  }

  // Parse layout
  private static parseLayout(slide: any): any {
    const layout = slide['p:sldLayoutId'] || slide.sldLayoutId || {}
    
    return {
      id: layout['@attributes']?.id || 'default',
      name: layout['@attributes']?.name || 'Default Layout'
    }
  }

  // Parse layouts from master
  private static parseLayouts(master: any): any[] {
    const layouts = master['p:sldLayoutIdLst'] || master.sldLayoutIdLst || {}
    const layoutList = layouts['p:sldLayoutId'] || layouts.sldLayoutId || []
    
    if (!Array.isArray(layoutList)) return []
    
    return layoutList.map((layout, index) => ({
      id: layout['@attributes']?.id || `layout-${index}`,
      name: layout['@attributes']?.name || `Layout ${index + 1}`,
      number: index + 1
    }))
  }

  // Parse color scheme
  private static parseColorScheme(themeElements: any): any {
    const clrScheme = themeElements['a:clrScheme'] || themeElements.clrScheme || {}
    
    return {
      primary: this.parseColor(clrScheme['a:dk1'] || clrScheme.dk1),
      secondary: this.parseColor(clrScheme['a:dk2'] || clrScheme.dk2),
      accent1: this.parseColor(clrScheme['a:accent1'] || clrScheme.accent1),
      accent2: this.parseColor(clrScheme['a:accent2'] || clrScheme.accent2),
      accent3: this.parseColor(clrScheme['a:accent3'] || clrScheme.accent3),
      accent4: this.parseColor(clrScheme['a:accent4'] || clrScheme.accent4),
      accent5: this.parseColor(clrScheme['a:accent5'] || clrScheme.accent5),
      accent6: this.parseColor(clrScheme['a:accent6'] || clrScheme.accent6),
      hlink: this.parseColor(clrScheme['a:hlink'] || clrScheme.hlink),
      folHlink: this.parseColor(clrScheme['a:folHlink'] || clrScheme.folHlink)
    }
  }

  // Parse font scheme
  private static parseFontScheme(themeElements: any): any {
    const fontScheme = themeElements['a:fontScheme'] || themeElements.fontScheme || {}
    const majorFont = fontScheme['a:majorFont'] || fontScheme.majorFont || {}
    const minorFont = fontScheme['a:minorFont'] || fontScheme.minorFont || {}
    
    return {
      major: {
        name: majorFont['a:latin']?.['@attributes']?.typeface || 'Arial',
        script: majorFont['a:ea']?.['@attributes']?.typeface || 'Arial',
        complex: majorFont['a:cs']?.['@attributes']?.typeface || 'Arial'
      },
      minor: {
        name: minorFont['a:latin']?.['@attributes']?.typeface || 'Arial',
        script: minorFont['a:ea']?.['@attributes']?.typeface || 'Arial',
        complex: minorFont['a:cs']?.['@attributes']?.typeface || 'Arial'
      }
    }
  }

  // Helper methods
  private static getShapeType(shape: any): string {
    const spPr = shape['p:spPr'] || shape.spPr || {}
    const prstGeom = spPr['a:prstGeom'] || spPr.prstGeom || {}
    
    return prstGeom['@attributes']?.prst || 'rectangle'
  }

  private static parsePosition(shape: any): { x: number; y: number } {
    const spPr = shape['p:spPr'] || shape.spPr || {}
    const xfrm = spPr['a:xfrm'] || spPr.xfrm || {}
    const off = xfrm['a:off'] || xfrm.off || {}
    
    return {
      x: parseInt(off['@attributes']?.x || '0'),
      y: parseInt(off['@attributes']?.y || '0')
    }
  }

  private static parseSize(shape: any): { width: number; height: number } {
    const spPr = shape['p:spPr'] || shape.spPr || {}
    const xfrm = spPr['a:xfrm'] || spPr.xfrm || {}
    const ext = xfrm['a:ext'] || xfrm.ext || {}
    
    return {
      width: parseInt(ext['@attributes']?.cx || '0'),
      height: parseInt(ext['@attributes']?.cy || '0')
    }
  }

  private static parseText(shape: any): any {
    const txBody = shape['p:txBody'] || shape.txBody || {}
    const bodyPr = txBody['a:bodyPr'] || txBody.bodyPr || {}
    const p = txBody['a:p'] || txBody.p || []
    
    if (!Array.isArray(p)) return null
    
    return {
      paragraphs: p.map((paragraph, index) => ({
        id: `p-${index}`,
        runs: this.parseRuns(paragraph),
        alignment: bodyPr['@attributes']?.anchor || 't',
        margins: this.parseMargins(bodyPr)
      }))
    }
  }

  private static parseRuns(paragraph: any): any[] {
    const runs = paragraph['a:r'] || paragraph.r || []
    
    if (!Array.isArray(runs)) return []
    
    return runs.map((run, index) => ({
      id: `run-${index}`,
      text: run['a:t'] || run.t || '',
      style: this.parseRunStyle(run)
    }))
  }

  private static parseRunStyle(run: any): any {
    const rPr = run['a:rPr'] || run.rPr || {}
    
    return {
      font: rPr['@attributes']?.typeface || 'Arial',
      size: parseInt(rPr['@attributes']?.sz || '1800'),
      bold: rPr['a:b'] !== undefined,
      italic: rPr['a:i'] !== undefined,
      color: this.parseColor(rPr['a:solidFill'] || rPr.solidFill)
    }
  }

  private static parseStyle(shape: any): any {
    const spPr = shape['p:spPr'] || shape.spPr || {}
    
    return {
      fill: this.parseFill(spPr),
      stroke: this.parseStroke(spPr),
      effects: this.parseEffects(spPr)
    }
  }

  private static parseFill(spPr: any): any {
    const solidFill = spPr['a:solidFill'] || spPr.solidFill
    const gradFill = spPr['a:gradFill'] || spPr.gradFill
    
    if (solidFill) {
      return {
        type: 'solid',
        color: this.parseColor(solidFill)
      }
    }
    
    if (gradFill) {
      return {
        type: 'gradient',
        stops: this.parseGradientStops(gradFill)
      }
    }
    
    return { type: 'none' }
  }

  private static parseStroke(spPr: any): any {
    const ln = spPr['a:ln'] || spPr.ln
    
    if (!ln) return { type: 'none' }
    
    return {
      type: 'solid',
      width: parseInt(ln['@attributes']?.w || '0'),
      color: this.parseColor(ln['a:solidFill'] || ln.solidFill),
      cap: ln['@attributes']?.cap || 'rnd',
      join: ln['@attributes']?.join || 'rnd'
    }
  }

  private static parseEffects(spPr: any): any {
    const effectLst = spPr['a:effectLst'] || spPr.effectLst
    
    if (!effectLst) return {}
    
    return {
      shadow: this.parseShadow(effectLst['a:outerShdw'] || effectLst.outerShdw),
      glow: this.parseGlow(effectLst['a:glow'] || effectLst.glow),
      reflection: this.parseReflection(effectLst['a:reflection'] || effectLst.reflection)
    }
  }

  private static parseColor(colorNode: any): any {
    if (!colorNode) return null
    
    if (colorNode['a:srgbClr'] || colorNode.srgbClr) {
      const srgb = colorNode['a:srgbClr'] || colorNode.srgbClr
      return {
        type: 'srgb',
        value: srgb['@attributes']?.val || '000000'
      }
    }
    
    if (colorNode['a:schemeClr'] || colorNode.schemeClr) {
      const scheme = colorNode['a:schemeClr'] || colorNode.schemeClr
      return {
        type: 'scheme',
        value: scheme['@attributes']?.val || 'accent1'
      }
    }
    
    return null
  }

  private static parseGradientStops(gradFill: any): any[] {
    const gsLst = gradFill['a:gsLst'] || gradFill.gsLst || {}
    const gs = gsLst['a:gs'] || gsLst.gs || []
    
    if (!Array.isArray(gs)) return []
    
    return gs.map((stop, index) => ({
      position: parseInt(stop['@attributes']?.pos || '0'),
      color: this.parseColor(stop['a:solidFill'] || stop.solidFill)
    }))
  }

  private static parseMargins(bodyPr: any): any {
    return {
      left: parseInt(bodyPr['@attributes']?.lIns || '0'),
      top: parseInt(bodyPr['@attributes']?.tIns || '0'),
      right: parseInt(bodyPr['@attributes']?.rIns || '0'),
      bottom: parseInt(bodyPr['@attributes']?.bIns || '0')
    }
  }

  private static parseShadow(shadow: any): any {
    if (!shadow) return null
    
    return {
      color: this.parseColor(shadow['a:solidFill'] || shadow.solidFill),
      blur: parseInt(shadow['@attributes']?.blurRad || '0'),
      distance: parseInt(shadow['@attributes']?.dist || '0'),
      direction: parseInt(shadow['@attributes']?.dir || '0')
    }
  }

  private static parseGlow(glow: any): any {
    if (!glow) return null
    
    return {
      color: this.parseColor(glow['a:solidFill'] || glow.solidFill),
      radius: parseInt(glow['@attributes']?.rad || '0')
    }
  }

  private static parseReflection(reflection: any): any {
    if (!reflection) return null
    
    return {
      alpha: parseInt(reflection['@attributes']?.alpha || '0'),
      distance: parseInt(reflection['@attributes']?.dist || '0'),
      blur: parseInt(reflection['@attributes']?.blurRad || '0')
    }
  }
}
