const multer= require('multer');
const path= require('path');
const fs= require('fs');

//MULTER
const upload= (filePath, name) => {
    return multer({
        storage: multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, filePath)
            },
            filename: (req, file, cb) => {
                cb(null, file.originalname.split('.')[0]+''+path.extname(file.originalname))
            },
        }),
        fileFilter: (req, file, cb) => {
            checkFileType(file, cb);
        }
    }).single(name);
};

const checkFileType = (file, cb) => {
    let extName= path.extname(file.originalname);

    if (extName === '.jpg' || extName === '.png') {
        return cb(null, true);
    } else {
        cb(null, false);
    }
};

module.exports= upload;