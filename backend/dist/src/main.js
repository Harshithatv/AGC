"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const express = require("express");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    app.use(express.json({ limit: '10mb', type: '*/*' }));
    app.use(express.urlencoded({ extended: true }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true }
    }));
    app.use('/uploads', express.static((0, path_1.join)(process.cwd(), 'uploads')));
    const port = process.env.PORT ? Number(process.env.PORT) : 3001;
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map