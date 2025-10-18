import ImageKit from "imagekit";
class ImageKitUtils {
    public imagekit: ImageKit;

    constructor() {
        this.imagekit = new ImageKit({
            publicKey: process.env.IMAGE_KIT_PUBLIC_KEY,
            privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGE_KIT_URL_ENDPOINT
        })
    }
}

export const imageKit = new ImageKitUtils().imagekit