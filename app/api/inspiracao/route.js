export async function POST(req){
  try{
    const {descricao}=await req.json()
    const prompt=descricao?.trim()||'beauty salon inspiration'
    return Response.json({ok:true,prompt})
  }catch(e){
    return Response.json({ok:false,prompt:'beauty salon inspiration'})
  }
}
