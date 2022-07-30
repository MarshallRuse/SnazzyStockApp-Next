import { prisma } from "@lib/prisma";

async function main() {
    // const alice = await prisma.user.upsert({
    //     where: { email: "alice@prisma.io" },
    //     update: {},
    //     create: {
    //         email: "alice@prisma.io",
    //         name: "Alice",
    //         posts: {
    //             create: {
    //                 title: "Check out Prisma with Next.js",
    //                 content: "https://www.prisma.io/nextjs",
    //                 published: true,
    //             },
    //         },
    //     },
    // });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
