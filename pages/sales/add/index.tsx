import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "pages/api/auth/[...nextauth]";
import Link from "next/link";
import Image from "next/image";
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await unstable_getServerSession(context.req, context.res, authOptions);
    if (!session) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
};

const AddSalesPage = () => {
    return (
        <div className='grid grid-cols-12 gap-4 items-center'>
            <div className='col-span-12'>
                <h1>Add Sales</h1>
            </div>
            <div className='col-span-3'>
                <Link href='/sales/add/HBC'>
                    <a>
                        <div className='p-4 shadow-light rounded-md w-72 border border-zinc-100 transition hover:scale-105 hover:shadow-bluegreenLight'>
                            <Image width={374} height={242} src='/images/HBC_Logo.png' layout='responsive' />
                        </div>
                    </a>
                </Link>
            </div>
        </div>
    );
};

export default AddSalesPage;
