export async function POST(req){
  try{
    const {descricao,fotoBase64}=await req.json()
    const key=process.env.GOOGLE_API_KEY
    if(!key) return Response.json({ok:false,error:'Chave não configurada'})

    // Prompt sempre focado em unhas
    const prompt=`Fotografia profissional de nail art, unhas: ${descricao||'estilo elegante'}. Close nas unhas, alta definição, fundo neutro, iluminação de estúdio.`

    const body={
      prompt,
      number_of_images:1,
      aspect_ratio:'1:1',
      safety_filter_level:'block_only_high',
      person_generation:'allow_adult'
    }

    // Se veio foto de referência, usa Gemini Vision para descrever antes
    if(fotoBase64){
      const visionRes=await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            contents:[{parts:[
              {inline_data:{mime_type:'image/jpeg',data:fotoBase64}},
              {text:`Descreva em inglês (máximo 20 palavras) o estilo de unhas nessa foto para gerar uma imagem similar. Apenas o prompt, sem explicações.`}
            ]}]
          })
        }
      )
      const visionJson=await visionRes.json()
      const desc=visionJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if(desc) body.prompt=`Professional nail art photo, nails: ${desc}, ${descricao||''}. Close-up, high definition, neutral background.`
    }

    const res=await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${key}`,
      {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}
    )
    const data=await res.json()
    const b64=data.generatedImages?.[0]?.image?.imageBytes
    if(b64) return Response.json({ok:true,imageData:`data:image/png;base64,${b64}`,prompt:body.prompt})

    // Fallback Pollinations se Imagen falhar
    const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(`nail art professional photo, ${descricao}, close up, high quality, studio lighting`)}?model=flux-realism&width=512&height=512&nologo=true&seed=${Date.now()}`
    return Response.json({ok:true,imageData:url,prompt:body.prompt})

  }catch(e){
    return Response.json({ok:false,error:e.message})
  }
}
