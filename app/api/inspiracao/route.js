export async function POST(req){
  try{
    const {descricao,fotoBase64}=await req.json()

    const prompt=`professional nail art photo, ${descricao||'elegant nails'}, close-up shot, studio lighting, high resolution, sharp focus, beautiful manicure, neutral background`

    // Hugging Face - FLUX.1-schnell (gratuito, sem chave)
    const res=await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          inputs:prompt,
          parameters:{
            width:512,
            height:512,
            num_inference_steps:4,
            guidance_scale:0
          }
        })
      }
    )

    if(!res.ok) throw new Error('HF error: '+res.status)

    // Resposta é binário (imagem direta)
    const buffer=await res.arrayBuffer()
    const b64=Buffer.from(buffer).toString('base64')
    const mime=res.headers.get('content-type')||'image/jpeg'

    return Response.json({ok:true,imageData:`data:${mime};base64,${b64}`,prompt})

  }catch(e){
    // Fallback Pollinations flux-realism
    try{
      const {descricao:d}=await req.clone().json().catch(()=>({}))
      const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(`professional nail art, ${d||'elegant nails'}, close up, studio lighting, high quality`)}?model=flux-realism&width=512&height=512&nologo=true&seed=${Date.now()}`
      return Response.json({ok:true,imageData:url,prompt:''})
    }catch{
      return Response.json({ok:false,error:e.message})
    }
  }
}
