import path from 'path';
import multer from 'multer';

const upload = multer({
    dest: "uploads/",
    limits: {fileSize: 70 * 1024 * 1024}, //70 mb in size
    storage: multer.diskStorage({
        destination: "uploads/",
        filename: (_req, file, cb) => {
            cb(null, file.originalname)
        }
    }),
    fileFilter: (_req, file, cb) => {
    let ext = path.extname(file.originalname);
    if(
        ext !== '.jpg' &&
        ext !== '.jpeg' &&
        ext !== '.webp' &&
        ext !== '.png' &&
        ext !== '.mp4'
    ){
        cb(new Error(`unspported file type! ${ext}`), false)
        return;
    }
    cb(null, true)
}

})

export default upload