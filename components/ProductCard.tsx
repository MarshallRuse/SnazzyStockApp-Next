import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { Product } from "@prisma/client";

type Props = {
    name: string;
    id: string;
    imageSrc?: string;
    variations: Product[];
};

const ProductCard = ({ name, id, imageSrc, variations }: Props) => {
    const [expanded, setExpanded] = useState(false);

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    return (
        <div className='col-span-12 sm:col-span-6 md:col-span-4 p-6'>
            <Card
                className={`h-full m-auto transition hover:shadow-light hover:-translate-x-1 hover:-translate-y-1 ${
                    variations.length === 0 ? "h-full" : ""
                }`}
            >
                <div className='flex flex-col items-center'>
                    <Link href={`/products/${id}`} passHref>
                        <CardActionArea className={variations.length === 0 ? "h-full" : ""}>
                            <Image
                                src={imageSrc ? imageSrc : "/images/products/SnazzyStonesPlaceholder.png"}
                                width={200}
                                height={200}
                                layout='responsive'
                                alt={name}
                            />
                            <CardContent className={variations.length === 0 ? "h-full" : ""}>
                                <Typography gutterBottom variant='h5' component='h2'>
                                    {name}
                                </Typography>
                                <Typography variant='body2' color='textSecondary' component='p'>
                                    {id}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Link>
                    {variations.length > 0 && (
                        <>
                            <CardActions disableSpacing className='w-full px-4 border-t border-t-zinc-500'>
                                <Typography variant='body2' color='textPrimary' component='p'>
                                    {`Variations (${variations.length}):`}
                                </Typography>
                                <IconButton
                                    className={`ml-auto transition ${expanded ? "rotate-180" : ""}`}
                                    onClick={handleExpandClick}
                                    aria-expanded={expanded}
                                    aria-label='show more'
                                >
                                    <ExpandMoreIcon />
                                </IconButton>
                            </CardActions>
                            <Collapse in={expanded} timeout='auto' unmountOnExit>
                                <CardContent>
                                    <List component='nav'>
                                        {variations.map((variant) => {
                                            return (
                                                <ListItem button key={variant.id + variant.sku}>
                                                    <ListItemText
                                                        primary={`${name} - ${variant.variationName}`}
                                                        secondary={variant.sku}
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </CardContent>
                            </Collapse>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ProductCard;
