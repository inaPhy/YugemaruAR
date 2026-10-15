// Run after installing @8thwall/image-target-cli@1.0.0 and sharp in the project.
import sharp from 'sharp';
import {applyCrop} from '@8thwall/image-target-cli/src/apply.js';
const data=await sharp('dist/assets/qr.png').resize(960,960,{kernel:'nearest'}).png().toBuffer();
await applyCrop(sharp(data),{type:'PLANAR',geometry:{top:0,left:0,width:960,height:960,originalWidth:960,originalHeight:960,isRotated:false}},'dist/image-targets','yugemaru-qr',true);
