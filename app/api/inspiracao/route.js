export async function POST(req){
  try{
    const {descricao,fotoBase64}=await req.json()
    const key=process.env.GOOGLE_API_KEY
    if(!key) return Response.json({ok:false,error:'Chave não configurada'})

    const prompt=`Crie uma foto profissional de nail art mostrando: ${descricao||'unhas elegantes'}. Close-up nas unhas, alta definição, fundo neutro, iluminação de estúdio, resultado final impecável.`

    const parts=[]
    if(fotoBase64) parts.push({inline_data:{mime_type:'image/jpeg',data:fotoBase64}})
    parts.push({text:prompt})

    const res=await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${key}`,
      {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[{parts}],
          generationConfig:{responseModalities:['IMAGE','TEXT']}
        })
      }
    )
    const data=await res.json()

    // Extrai imagem da resposta
    const imgPart=data.candidates?.[0]?.content?.parts?.find(p=>p.inline_data)
    if(imgPart?.inline_data){
      const {mime_type,data:b64}=imgPart.inline_data
      return Response.json({ok:true,imageData:`data:${mime_type};base64,${b64}`,prompt})
    }

    // Fallback Pollinations com modelo flux-realism
    const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(`nail art professional photo, ${descricao}, close up, high quality, studio lighting, realistic`)}?model=flux-realism&width=512&height=512&nologo=true&seed=${Date.now()}`
    return Response.json({ok:true,imageData:url,prompt})

  }catch(e){
    return Response.json({ok:false,error:e.message})
  }
}
