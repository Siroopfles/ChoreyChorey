'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label as UiLabel } from '@/components/ui/label';
import { Loader2, ImageIcon, PlusCircle, Trash2, Link as LinkIcon, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateTaskImage } from '@/ai/flows/generate-task-image-flow';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { getAttachmentSource } from '@/lib/utils/attachment-utils';
import { AttachmentIcon } from '../common/attachment-icons';
import { FigmaEmbed } from '../integrations/figma-embed';
import { GoogleDocEmbed } from '../integrations/google-doc-embed';
import { AdobeXdEmbed } from '../integrations/adobe-xd-embed';
import { uploadAttachmentFromDataUrl } from '@/app/actions/core/attachment.actions';

export function TaskFormAttachments() {
    const { control, getValues, setValue } = useFormContext();
    const { toast } = useToast();
    const { currentOrganization } = useAuth();
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { fields, append, remove } = useFieldArray({
        control,
        name: "attachments",
    });

    const imageUrl = getValues('imageUrl');

    const onGenerateImage = async () => {
        const title = getValues('title');
        const description = getValues('description');
        if (!title) {
            toast({ title: 'Titel is vereist om een afbeelding te genereren.', variant: 'destructive' });
            return;
        }
        if (!currentOrganization) {
            toast({ title: 'Organisatie niet gevonden', variant: 'destructive' });
            return;
        }
        setIsGeneratingImage(true);
        try {
            const result = await generateTaskImage({ title, description, organizationId: currentOrganization.id });
            setValue('imageUrl', result.imageUrl);
            toast({ title: 'Afbeelding gegenereerd en toegevoegd als omslagfoto!' });
        } catch (error: any) {
            toast({ title: 'Fout bij genereren afbeelding', description: error.message, variant: 'destructive' });
        }
        setIsGeneratingImage(false);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentOrganization) return;
    
        setIsUploading(true);
    
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const dataUrl = event.target?.result as string;
                const { url, error } = await uploadAttachmentFromDataUrl(dataUrl, file.name, currentOrganization.id);
                if (error) throw new Error(error);
                
                append({ name: file.name, url });
                toast({ title: 'Foto geüpload!', description: `${file.name} is succesvol als bijlage toegevoegd.` });
            } catch (err: any) {
                toast({ title: 'Fout bij uploaden', description: err.message, variant: 'destructive' });
            } finally {
                setIsUploading(false);
                // Reset file input to allow selecting the same file again
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.onerror = () => {
             toast({ title: 'Fout bij lezen bestand', description: 'Kon het fotobestand niet lezen.', variant: 'destructive' });
             setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };


    return (
        <div className="space-y-4">
            <div>
                <UiLabel>Omslagfoto</UiLabel>
                <div className="space-y-2 mt-2">
                {imageUrl && (
                    <div className="relative aspect-video w-full max-w-sm rounded-md border overflow-hidden">
                    <Image src={imageUrl} alt="Omslagfoto preview" layout="fill" objectFit="cover" />
                    <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => setValue('imageUrl', undefined)}
                        aria-label="Verwijder omslagfoto"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                )}
                <Button type="button" variant="outline" size="sm" onClick={onGenerateImage} disabled={isGeneratingImage}>
                    {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                    Genereer Omslagfoto (AI)
                </Button>
                </div>
            </div>

            <div>
                <UiLabel>Links &amp; Bijlagen</UiLabel>
                <div className="space-y-2 mt-2">
                {fields.map((field, index) => {
                    const urlValue = getValues(`attachments.${index}.url`);
                    const source = getAttachmentSource(urlValue);
                    const isEmbeddable = source.startsWith('google-') || source === 'figma' || source === 'adobe-xd';
                    return (
                        <div key={field.id} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-muted rounded-md">
                                    <AttachmentIcon source={source} />
                                </div>
                                <FormField
                                    control={control}
                                    name={`attachments.${index}.name`}
                                    render={({ field }) => (
                                        <Input {...field} placeholder="Naam bijlage" className="w-1/3"/>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`attachments.${index}.url`}
                                    render={({ field }) => (
                                        <Input {...field} placeholder="https://..."/>
                                    )}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Verwijder bijlage">
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </div>
                            {isEmbeddable && urlValue && source === 'figma' && <FigmaEmbed url={urlValue} />}
                            {isEmbeddable && urlValue && source.startsWith('google-') && <GoogleDocEmbed url={urlValue} />}
                            {isEmbeddable && urlValue && source === 'adobe-xd' && <AdobeXdEmbed url={urlValue} />}
                        </div>
                    )
                })}
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                 />
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', url: '' })}>
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Link toevoegen
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                        Maak Foto
                    </Button>
                </div>
                </div>
            </div>
        </div>
    );
}
