const sharp = require("sharp");

const { Storage } = require("@google-cloud/storage");

// exports.upload = multer({ storage });

exports.uploadDoc = (buffer) => {
  const bucketName = process.env.BUCKET;
  const originalName = req.file.originalname;
  const userId = req.body.userId;

  // Creates a client
  const GCStorage = new Storage();
  const bucket = GCStorage.bucket(bucketName);

  async function uploadFile() {
    // const { originalname, buffer } = file;
    let fileName;
    if (req.file.mimetype.includes("image"))
      fileName = `${req.file.fieldname}-${Date.now()}.jpg`;
    else fileName = originalName;
    const blob = bucket.file(originalName.replace(/ /g, "_"));
    const blobStream = blob.createWriteStream({
      resumable: false,
    });
    blobStream.on("finish", () => {
      blob.move(fileName).then(async () => {
        bucket.file(fileName).makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      });
    });

    if (req.file.mimetype.includes("image")) {
      const fileBuffer = await sharp(req.file.buffer)
        .jpeg({
          options: {
            quality: 85,
            chromaSubsampling: "4:4:4",
          },
        })
        .toBuffer();
      blobStream.end(fileBuffer);
    } else {
      blobStream.end(req.file.buffer);
    }
  }

  uploadFile().catch((error) => {
    handleResponse(res, 500, { error: "Server error" });
  });
};
