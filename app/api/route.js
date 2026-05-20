export async function POST(req){
  try{
    const {descricao,fotoBase64}=await req.json()
    const key=process.env.GOOGLE_API_KEY
    if(!key) return Response.json({ok:false,error:'Chave não configurada'})

    const prompt=`Imagem de inspiração para salão de beleza: ${descricao||'estilo natural e elegante'}. Foto profissional, alta qualidade, foco no resultado final do serviço.`

    // Tenta com Imagen 3
    const res=await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${key}`,
      {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          prompt,
          number_of_images:1,
          aspect_ratio:'1:1',
          safety_filter_level:'block_only_high',
          person_generation:'allow_adult'
        })
      }
    )
    const data=await res.json()
    const b64=data.generatedImages?.[0]?.image?.imageBytes
    if(b64) return Response.json({ok:true,imageData:`data:image/png;base64,${b64}`,prompt})

    // Fallback: Pollinations se Imagen falhar
    const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux-realism&width=512&height=512&nologo=true&seed=${Date.now()}`
    return Response.json({ok:true,imageData:url,prompt})

  }catch(e){
    const desc=req.body?.descricao||'beauty'
    const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(`beauty salon inspiration ${desc}`)}?model=flux-realism&width=512&height=512&nologo=true`
    return Response.json({ok:true,imageData:url,prompt:''})
  }
}
